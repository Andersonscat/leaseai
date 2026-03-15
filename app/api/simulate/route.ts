import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  calculateLeadScore,
  getLeadQuality,
  formatBookingDetails,
  flattenExtractedData,
  getRankedPropertyMatches,
  scorePropertyMatch,
  validateBookingAction,
  cleanMessageForHistory,
  extractKnownFields,
  runAgentPipeline,
  type AgentResult,
  type RankedPropertyMatch,
} from '@/lib/ai-qualification';
import { runGuardrailPipeline } from '@/lib/ai/guardrails';
import { loadConversationMemory, summarizeConversationIfNeeded } from '@/lib/ai/memory';
import { extractClientData, mergeExtractionWithAgent } from '@/lib/ai/extraction';
import type { AiAnalysis } from '@/lib/ai/types';
import { getOAuthTokens } from '@/lib/oauth-tokens';

function getAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const pipelineStages: { stage: string; durationMs: number; detail?: string }[] = [];

  try {
    const supabase = getAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientName, clientEmail, clientPhone, message, tenantId: existingTenantId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const name = clientName || 'Test Client';
    const email = clientEmail || `test-${Date.now()}@simulate.local`;
    const phone = clientPhone || undefined;

    const db = getServiceClient();

    // ─── 1. FIND OR CREATE TENANT ───────────────────────────────────────
    let t1 = Date.now();
    let tenantId = existingTenantId || null;
    let isNew = false;
    let existingTenant: any = null;

    if (tenantId) {
      const { data } = await db
        .from('tenants')
        .select('id, auto_reply_enabled, gmail_thread_id, email, name, qualification_status')
        .eq('id', tenantId)
        .eq('user_id', user.id)
        .single();
      existingTenant = data;
      if (!existingTenant) tenantId = null;
    }

    if (!tenantId) {
      const { data: tenants } = await db
        .from('tenants')
        .select('id, auto_reply_enabled, gmail_thread_id, email, name, qualification_status')
        .eq('user_id', user.id)
        .ilike('email', email);
      existingTenant = tenants?.[0];
      tenantId = existingTenant?.id || null;
    }

    if (!tenantId) {
      const { data: newTenant, error } = await db
        .from('tenants')
        .insert({
          user_id: user.id,
          name,
          email,
          phone,
          status: 'Pending',
          auto_reply_enabled: true,
          qualification_status: 'new',
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: 'Failed to create tenant: ' + error.message }, { status: 500 });
      tenantId = newTenant.id;
      isNew = true;
    }
    pipelineStages.push({ stage: 'tenant', durationMs: Date.now() - t1, detail: isNew ? 'created' : 'found' });

    // ─── 2. INSERT CLIENT MESSAGE ───────────────────────────────────────
    const { error: msgErr } = await db.from('messages').insert({
      user_id: user.id,
      tenant_id: tenantId,
      sender_type: 'tenant',
      sender_name: name,
      message_text: message,
      source: 'simulate',
      is_read: false,
    });

    if (msgErr) return NextResponse.json({ error: 'Failed to insert message: ' + msgErr.message }, { status: 500 });

    // ─── 3-6. LOAD PROPERTIES, MESSAGES, TENANT IN PARALLEL ────────────
    const [
      { data: properties },
      { data: tenantRow },
      memory,
    ] = await Promise.all([
      db.from('properties').select('*, building:buildings(id, name, amenities, rules, pet_policy, parking_type, walk_score, transit_score)').eq('user_id', user.id)
        .is('deleted_at', null),
      db.from('tenants').select('*').eq('id', tenantId).single(),
      loadConversationMemory(db, user.id, tenantId),
    ]);

    console.log(`🏠 Properties loaded: ${properties?.length ?? 0}. Addresses: ${properties?.map(p => `${p.address} [status=${p.status}, price=${p.price_monthly || p.price}, img=${p.images?.[0] ? (String(p.images[0]).startsWith('http') ? 'URL' : String(p.images[0]).substring(0, 15) + '...') : 'NONE'}]`).join(' | ') || 'none'}`);

    const conversationHistory = memory.recentMessages.map(msg => ({
      role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
      content: cleanMessageForHistory(msg.message_text),
    }));

    const realtorName = user.user_metadata?.ai_signature_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent';
    const realtorPhone = user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone || undefined;
    const realtorCompany = user.user_metadata?.company || user.user_metadata?.brokerage_name || '';
    const timezone = user.user_metadata?.timezone || 'America/Los_Angeles';
    const viewingHoursStart = user.user_metadata?.viewing_hours_start || '10:00';
    const viewingHoursEnd = user.user_metadata?.viewing_hours_end || '20:00';

    // =================================================================
    // OPTIMIZED PIPELINE: Single Gemini call (Brain+Voice) → Hand → Judge
    // =================================================================

    // Detect if client has already seen properties (to show more on request)
    const alreadyShownAddresses: string[] = [];
    for (const msg of conversationHistory) {
      if (msg.role === 'assistant' && msg.content?.includes('---PROPERTIES_JSON---')) {
        try {
          const jsonStr = msg.content.split('---PROPERTIES_JSON---')[1]?.split('---END_PROPERTIES_JSON---')[0]?.trim();
          if (jsonStr) {
            const shown = JSON.parse(jsonStr) as { address: string }[];
            shown.forEach(p => { if (p.address) alreadyShownAddresses.push(p.address); });
          }
        } catch { /* ignore */ }
      }
    }
    const hasShownBefore = alreadyShownAddresses.length > 0;
    const maxResults = hasShownBefore ? 5 : 3;

    // Pre-compute ranked matches using existing tenant data so AI writes about the same properties shown as cards
    const preFlatTenant = { ...(tenantRow || {}) };
    const preRankedMatches = properties?.length
      ? getRankedPropertyMatches(preFlatTenant, properties, {
          maxResults,
          alreadyShown: alreadyShownAddresses,
        }).map(r => ({
          address: r.property.address,
          score: r.score,
          reason: r.reason,
          price: r.property.price_monthly || r.property.price,
          beds: r.property.beds ?? r.property.bedrooms,
          baths: r.property.baths ?? r.property.bathrooms,
          sqft: r.property.sqft,
        }))
      : [];

    const oauthRow = await getOAuthTokens(user.id);

    const context = {
      tenant: {
        id: tenantId,
        name: tenantRow?.name || name,
        email,
        phone,
        qualification_status: isNew ? 'new' : (tenantRow?.qualification_status || 'qualifying'),
      },
      properties: properties || [],
      conversationHistory,
      conversationSummary: memory.summary || undefined,
      realtorName,
      realtorPhone,
      realtorCompany,
      timezone,
      viewingHoursStart,
      viewingHoursEnd,
      knownFields: tenantRow ? extractKnownFields(tenantRow) : undefined,
      oauthRefreshToken: oauthRow?.refresh_token,
      preRankedMatches: preRankedMatches.length > 0 ? preRankedMatches : undefined,
    };

    // =================================================================
    // STEP 1: FORCED EXTRACTION (Structured Output — guaranteed)
    // =================================================================
    t1 = Date.now();
    const extraction = await extractClientData(message, conversationHistory);
    pipelineStages.push({ stage: 'extraction', durationMs: Date.now() - t1, detail: extraction.hasData ? 'data_found' : 'no_data' });

    // Save extraction data to tenant immediately (before agent runs)
    if (extraction.hasData) {
      const extFlat = flattenExtractedData(extraction.data);
      if (Object.keys(extFlat).length > 0) {
        const extUpdate: Record<string, any> = {};
        if (extFlat.budget_max) extUpdate.budget_max = extFlat.budget_max;
        if (extFlat.move_in_date) extUpdate.move_in_date = extFlat.move_in_date;
        if (extFlat.bedrooms) extUpdate.bedrooms = extFlat.bedrooms;
        if (extFlat.bathrooms) extUpdate.bathrooms = extFlat.bathrooms;
        if (extFlat.num_occupants != null) extUpdate.num_occupants = extFlat.num_occupants;
        if (extFlat.has_pets === true || extFlat.has_pets === false) extUpdate.has_pets = extFlat.has_pets;
        if (extFlat.property_type) extUpdate.property_type = extFlat.property_type;
        if (extFlat.lease_duration) extUpdate.lease_duration = extFlat.lease_duration;
        if (extFlat.preferred_city) extUpdate.preferred_city = extFlat.preferred_city;
        if (extFlat.preferred_state) extUpdate.preferred_state = extFlat.preferred_state;
        if (extFlat.must_haves) extUpdate.must_haves = extFlat.must_haves;
        if (extFlat.deal_breakers) extUpdate.deal_breakers = extFlat.deal_breakers;
        if (extFlat.needs_parking) extUpdate.needs_parking = true;
        if (extFlat.furnishing) extUpdate.furnishing = extFlat.furnishing;
        if (extraction.data.personal?.firstName) {
          const fn = extraction.data.personal.firstName;
          const ln = extraction.data.personal.lastName;
          extUpdate.name = ln ? `${fn} ${ln}` : fn;
        }
        if (extraction.data.pets && Object.keys(extraction.data.pets).length > 0) {
          extUpdate.pet_details = extraction.data.pets;
        }

        if (Object.keys(extUpdate).length > 0) {
          await db.from('tenants').update(extUpdate).eq('id', tenantId);
          console.log(`💾 Extraction saved to tenant: ${Object.keys(extUpdate).join(', ')}`);
        }
      }

      // Refresh knownFields so the agent sees the extracted data
      const { data: refreshedTenant } = await db.from('tenants').select('*').eq('id', tenantId).single();
      if (refreshedTenant) {
        context.knownFields = extractKnownFields(refreshedTenant);
      }
    }

    // =================================================================
    // STEP 2: AGENT PIPELINE (Tool Calling — response generation)
    // =================================================================
    const fallbackReply = `Hi ${(tenantRow?.name || name).split(' ')[0]}, thank you for your message! I'm reviewing the details and will get back to you shortly.`;

    let analysis: AiAnalysis;
    let finalResponseText: string;
    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };
    let appointmentSaved = false;
    let rankedMatches: RankedPropertyMatch[] = [];
    let hallucinationBlocked = false;
    let guardrailResult: import('@/lib/ai/guardrails').GuardrailPipelineResult;

    {
      // ─── AGENT PIPELINE: Tool Calling ─────────────────────────────────
      t1 = Date.now();
      let agentResult: AgentResult;
      try {
        agentResult = await runAgentPipeline(context);
      } catch (agentErr: any) {
        console.error('❌ Agent pipeline failed, falling back to legacy:', agentErr?.message);
        agentResult = {
          responseText: fallbackReply,
          action: 'reply',
          extractedData: null,
          listingAddresses: [],
          photoMode: false,
          actionParams: null,
          escalationReason: null,
          humanActionRequests: [],
          toolsUsed: [],
          thoughtProcess: 'Agent pipeline failed',
        };
      }
      pipelineStages.push({ stage: 'agent', durationMs: Date.now() - t1, detail: `action=${agentResult.action}, tools=[${agentResult.toolsUsed.join(',')}]` });

      // Merge: extraction data + agent data (agent takes priority)
      if (extraction.hasData) {
        agentResult.extractedData = mergeExtractionWithAgent(extraction.data, agentResult.extractedData);
      }

      // Convert AgentResult → AiAnalysis for backward compat
      analysis = {
        thought_process: agentResult.thoughtProcess,
        intent: agentResult.action === 'book_calendar' ? 'booking_confirmed' : 'general',
        action: agentResult.action,
        action_params: agentResult.actionParams || undefined,
        extractedData: agentResult.extractedData || undefined,
        listing_addresses: agentResult.listingAddresses,
        photo_mode: agentResult.photoMode,
        escalation_reason: agentResult.escalationReason || undefined,
        priority: 'warm',
      };
      finalResponseText = agentResult.responseText;

      // ─── GUARDRAIL: validate booking before execution ───────────────
      if (analysis.action === 'book_calendar') {
        const validation = validateBookingAction(analysis, conversationHistory);
        if (!validation.valid) {
          console.log('🛡️ Guardrail override: book_calendar → reply');
          analysis.action = 'reply';
          analysis.action_params = undefined;
        }
      }

      // ─── HAND: Save appointment to DB (calendar event already created by dispatcher) ──
      t1 = Date.now();
      if (analysis.action === 'book_calendar' && analysis.action_params) {
        try {
          const args = analysis.action_params;
          const startTimeStr = (args.start_time || '').replace(/Z$/i, '').replace(/[+-]\d{2}:\d{2}$/, '').replace(/\.\d{3}$/, '');
          const duration = args.duration_minutes || 30;
          const endDate = new Date(new Date(startTimeStr).getTime() + duration * 60000);
          const endTimeStr = endDate.toISOString().replace(/Z$/i, '').replace(/\.\d{3}$/, '');

          await db.from('appointments').insert({
            user_id: user.id,
            tenant_id: tenantId,
            property_id: properties?.find(p => p.address === args.property_address)?.id || null,
            title: `Viewing: ${args.property_address}`,
            start_time: startTimeStr,
            end_time: endTimeStr,
            description: `Client: ${args.client_name || name}\nPhone: ${phone || 'N/A'}\nEmail: ${email}`,
            status: 'confirmed',
          });
          appointmentSaved = true;
          executionResult = { success: true };
        } catch (err: any) {
          console.error('Simulate: appointment save error:', err);
          executionResult = { success: false, error: err.message };
        }
      }
      pipelineStages.push({ stage: 'hand', durationMs: Date.now() - t1, detail: analysis.action === 'book_calendar' ? 'calendar' : 'none' });

      // ─── CODE: Resolve property cards ───────────────────────────────
      const flatTenant = { ...(tenantRow || {}), ...flattenExtractedData(analysis.extractedData) };
      if (flatTenant.preferred_city && !flatTenant.preferred_state && properties?.length) {
        const { inferStateFromProperties } = await import('@/lib/ai-qualification');
        const inferred = inferStateFromProperties(flatTenant.preferred_city, properties);
        if (inferred) flatTenant.preferred_state = inferred.toUpperCase();
      }

      if (analysis.action === 'send_listing' && properties?.length) {
        const aiAddresses = (analysis.listing_addresses ?? []).filter(Boolean);
        if (aiAddresses.length > 0) {
          const resolvedProperties = aiAddresses
            .map(addr => {
              const addrLow = addr.toLowerCase().trim();
              return properties.find(p => {
                const pAddr = (p.address || '').toLowerCase();
                return pAddr === addrLow || pAddr.includes(addrLow) || addrLow.includes(pAddr);
              });
            })
            .filter((p): p is NonNullable<typeof p> => Boolean(p));

          if (resolvedProperties.length > 0) {
            const scored = resolvedProperties.map(p => {
              const { score, reason, clusters, isNearby, disqualified } = scorePropertyMatch(flatTenant, p);
              return { property: p, score, reason, clusters, isNearby, disqualified };
            });
            rankedMatches = scored.filter(r => !r.disqualified);
            if (rankedMatches.length === 0) {
              rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults, alreadyShown: alreadyShownAddresses });
            }
          } else {
            rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults, alreadyShown: alreadyShownAddresses });
          }
        } else {
          rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults, alreadyShown: alreadyShownAddresses });
        }
      }

      // ─── GUARDRAILS PIPELINE ────────────────────────────────────────
      t1 = Date.now();
      const matchedPropsForCheck = rankedMatches.map(r => r.property);
      guardrailResult = runGuardrailPipeline(
        {
          responseText: finalResponseText,
          agentResult,
          properties: matchedPropsForCheck.length > 0 ? matchedPropsForCheck : (properties || []),
          conversationHistory,
          tenantEmail: email,
        },
        (tenantRow?.name || name).split(' ')[0]
      );
      if (guardrailResult.blocked || guardrailResult.rewritten) {
        console.log(`🛡️ Guardrails: blocked=${guardrailResult.blocked}, rewritten=${guardrailResult.rewritten}, checks=${guardrailResult.results.map(r => `${r.name}:${r.verdict}`).join(', ')}`);
        if (guardrailResult.blocked) {
          analysis.action = 'reply';
          hallucinationBlocked = true;
        }
      }
      finalResponseText = guardrailResult.finalText;
      pipelineStages.push({ stage: 'guardrails', durationMs: Date.now() - t1, detail: hallucinationBlocked ? 'blocked' : guardrailResult.rewritten ? 'rewritten' : 'passed' });

    }

    const matchedProperties = rankedMatches.map(r => r.property);

    // ─── ATTACH BOOKING BLOCK ───────────────────────────────────────────
    let finalResponse = finalResponseText;
    if (analysis.action === 'book_calendar' && executionResult.success && analysis.action_params) {
      const bookingBlock = formatBookingDetails({
        address: analysis.action_params.property_address,
        calendarLink: executionResult.data?.htmlLink || '',
        eventTime: analysis.action_params.start_time,
        realtorName,
        realtorPhone: realtorPhone || 'Contact for details',
      });
      finalResponse = `${finalResponseText}\n\n\n${bookingBlock}`;
    }

    let dbMessageText = finalResponse;
    if (!dbMessageText?.trim()) {
      console.error('🚨 EMPTY AI RESPONSE DETECTED — using fallback');
      dbMessageText = fallbackReply;
    }

    // Safety net: filter out properties the Voice didn't mention in its text.
    // This prevents orphan cards that confuse the user.
    const textLower = finalResponseText.toLowerCase();
    const mentionedProperties = matchedProperties.filter(p => {
      const addr = (p.address || '').toLowerCase();
      // Check if the address (or its street part) appears in the reply text
      const streetPart = addr.split(',')[0]?.trim();
      return textLower.includes(streetPart) || textLower.includes(addr);
    });
    // Only filter if Voice mentioned at least one property (otherwise keep all — Voice might have used different wording)
    const cardsToAttach = mentionedProperties.length > 0 ? mentionedProperties : matchedProperties;
    // Rebuild rankedMatches in same order for score alignment
    const cardsRanked = cardsToAttach.map(p => rankedMatches.find(r => r.property === p)!).filter(Boolean);
    if (cardsToAttach.length < matchedProperties.length) {
      console.log(`🔧 Filtered cards: ${matchedProperties.length} → ${cardsToAttach.length} (Voice only mentioned ${mentionedProperties.length})`);
    }

    if (cardsToAttach.length > 0) {
      // Resolve all images for a property (not just the first one)
      const resolveAllImages = (p: any): string[] => {
        const imgs = Array.isArray(p.images) ? p.images : [];
        const resolved: string[] = [];
        for (let i = 0; i < imgs.length; i++) {
          const url = typeof imgs[i] === 'string' ? imgs[i] : imgs[i]?.url;
          if (url && typeof url === 'string') {
            if (url.startsWith('http')) resolved.push(url);
            else if (url.startsWith('data:') && p.id) resolved.push(`/api/property-image/${p.id}?idx=${i}`);
          }
        }
        if (resolved.length === 0) {
          if (typeof p.image === 'string' && p.image.startsWith('http')) resolved.push(p.image);
          else if (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http')) resolved.push(p.thumbnail);
        }
        return resolved;
      };

      const cleanProps = cardsToAttach.map((p, i) => {
        const r = cardsRanked[i];
        const allImages = resolveAllImages(p);
        return {
          id: p.id,
          address: p.address,
          city: p.city,
          state: p.state,
          price: p.price_monthly || p.price,
          beds: p.beds ?? p.bedrooms,
          baths: p.baths ?? p.bathrooms,
          sqft: p.sqft,
          type: p.type,
          image: allImages[0] ?? null,
          images: allImages.length > 0 ? allImages : undefined,
          matchScore: r?.score ?? null,
          matchReason: r?.reason ?? null,
          matchClusters: r?.clusters ?? null,
          isNearby: r?.isNearby ?? false,
        };
      });
      dbMessageText += `\n\n---PROPERTIES_JSON---\n${JSON.stringify(cleanProps)}\n---END_PROPERTIES_JSON---`;
    }

    // ─── SAVE AI RESPONSE TO DB ─────────────────────────────────────────
    const thoughtsData = analysis.thought_process ? {
      thought_process: analysis.thought_process,
      action: analysis.action,
      intent: analysis.intent,
      priority: analysis.priority,
    } : null;

    const bestPropertyId = matchedProperties.length > 0
      ? matchedProperties[0].id
      : (analysis.action === 'book_calendar' && analysis.action_params
          ? properties?.find(p => p.address === analysis.action_params!.property_address)?.id
          : null) || null;

    // Progressive insert: try with all columns, strip failing ones
    const coreMsg = {
      user_id: user.id,
      tenant_id: tenantId,
      sender_type: 'landlord',
      sender_name: realtorName,
      message_text: dbMessageText,
      source: 'simulate',
      is_ai_response: true,
      is_read: true,
    };

    const optionalColumns: Record<string, any> = {};
    if (thoughtsData) optionalColumns.thoughts = thoughtsData;
    if (bestPropertyId) optionalColumns.property_id = bestPropertyId;

    let aiMsgErr: any = null;
    let insertPayload = { ...coreMsg, ...optionalColumns };

    const isColumnError = (err: any) =>
      err?.code === '42703' || err?.code === 'PGRST204' ||
      err?.message?.includes('does not exist') || err?.message?.includes('schema cache');

    // Attempt 1: all columns
    console.log(`💾 Insert attempt 1: columns=[${Object.keys(insertPayload).join(',')}], textLen=${dbMessageText.length}`);
    ({ error: aiMsgErr } = await db.from('messages').insert(insertPayload));

    // Attempt 2: strip failing column and retry
    if (isColumnError(aiMsgErr)) {
      const failedCol = aiMsgErr.message?.match(/['"](\w+)['"]/)?.[1];
      console.warn(`⚠️ Attempt 1 failed: column "${failedCol}" missing (${aiMsgErr.code}). Retrying without it.`);
      if (failedCol && insertPayload[failedCol] !== undefined) {
        delete insertPayload[failedCol];
      }
      ({ error: aiMsgErr } = await db.from('messages').insert(insertPayload));
    }

    // Attempt 3: if still failing, use core only
    if (isColumnError(aiMsgErr)) {
      const failedCol = aiMsgErr.message?.match(/['"](\w+)['"]/)?.[1];
      console.warn(`⚠️ Attempt 2 failed: column "${failedCol}" (${aiMsgErr.code}). Final retry with core columns only.`);
      ({ error: aiMsgErr } = await db.from('messages').insert(coreMsg));
    }

    if (aiMsgErr) {
      console.error('❌ Failed to save AI response after 3 attempts:', JSON.stringify(aiMsgErr));
    } else {
      console.log(`✅ AI message saved successfully (${dbMessageText.length} chars)`);
    }

    // ─── UPDATE TENANT WITH EXTRACTED DATA ──────────────────────────────
    // Mirrors sync-service.ts exactly
    if (analysis.extractedData || analysis.summary) {
      const ed = analysis.extractedData || {};
      const updateData: any = { last_auto_reply_at: new Date().toISOString() };

      // Update name from extracted personal data
      const extractedFirst = ed.personal?.firstName;
      const extractedLast = ed.personal?.lastName;
      if (extractedFirst) {
        updateData.name = extractedLast ? `${extractedFirst} ${extractedLast}` : extractedFirst;
      }

      if (analysis.summary) {
        updateData.notes = typeof analysis.summary === 'string'
          ? analysis.summary
          : [analysis.summary.client, analysis.summary.interests, analysis.summary.concerns, analysis.summary.next_step]
              .filter(Boolean).join(' | ');
      }
      const budgetVal = ed.budget?.budget_usd ?? ed.budget?.max_monthly_rent ?? ed.budget_max;
      if (budgetVal) updateData.budget_max = budgetVal;
      const moveIn = ed.timeline?.move_in_date ?? ed.move_in_date;
      if (moveIn) updateData.move_in_date = moveIn;
      if (ed.timeline?.lease_term_ideal_months) updateData.lease_duration = `${ed.timeline.lease_term_ideal_months}_months`;
      if (ed.housing?.bedrooms_min != null) updateData.bedrooms = ed.housing.bedrooms_min;
      if (ed.housing?.bathrooms_min != null) updateData.bathrooms = ed.housing.bathrooms_min;
      if (ed.housing?.furnished) {
        updateData.furnishing = ed.housing.furnished;
      } else if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.includes('furnished')) {
        updateData.furnishing = 'yes';
      }
      if (Array.isArray(ed.housing?.property_types) && ed.housing.property_types.length > 0) updateData.property_type = ed.housing.property_types[0];
      if (ed.occupants?.total_count != null) updateData.num_occupants = ed.occupants.total_count;
      if (ed.pets?.has_pets !== undefined) updateData.has_pets = ed.pets.has_pets;
      if (ed.pets && Object.keys(ed.pets).length > 0) updateData.pet_details = ed.pets;
      if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) updateData.must_haves = ed.amenities.desired_features;
      if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) updateData.deal_breakers = ed.amenities.deal_breakers;
      if (ed.amenities?.parking?.required === 'required') updateData.needs_parking = true;
      if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) updateData.preferred_neighborhoods = ed.location.neighborhoods_must;
      if (ed.location?.city && typeof ed.location.city === 'string' && ed.location.city.trim()) updateData.preferred_city = ed.location.city.trim();
      if (ed.location?.state && typeof ed.location.state === 'string' && ed.location.state.trim()) updateData.preferred_state = ed.location.state.trim();
      if (updateData.preferred_city && !updateData.preferred_state && !(tenantRow?.preferred_state) && properties?.length) {
        const { inferStateFromProperties } = await import('@/lib/ai-qualification');
        const inferred = inferStateFromProperties(updateData.preferred_city, properties);
        if (inferred) updateData.preferred_state = inferred.toUpperCase();
      }

      // Geocode tenant preferred city for distance-based scoring
      if (updateData.preferred_city && !(tenantRow?.preferred_lat)) {
        const { geocodeAddress } = await import('@/lib/geocoding');
        const cityQuery = updateData.preferred_state
          ? `${updateData.preferred_city}, ${updateData.preferred_state}`
          : updateData.preferred_city;
        const coords = await geocodeAddress(cityQuery);
        if (coords) {
          updateData.preferred_lat = coords.lat;
          updateData.preferred_lng = coords.lng;
        }
      }

      const score = calculateLeadScore({ ...(tenantRow || {}), ...updateData });
      updateData.lead_score = score;
      updateData.lead_quality = analysis.priority || getLeadQuality(score);
      if (score >= 60) updateData.qualification_status = 'qualified';
      else if (score >= 30) updateData.qualification_status = 'qualifying';

      let updatePayload = { ...updateData };
      let updateError: any = null;
      const maxRetries = 5;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        ({ error: updateError } = await db.from('tenants').update(updatePayload).eq('id', tenantId));
        if (!updateError || updateError.code !== '42703') break;
        const badCol = updateError.message?.match(/column\s+["']?(\w+)["']?/)?.[1]
          ?? updateError.message?.match(/["'](\w+)["']\s+.*does not exist/)?.[1];
        if (badCol && updatePayload[badCol] !== undefined) {
          console.warn(`⚠️ Tenant update: column "${badCol}" missing, stripping and retrying (attempt ${attempt + 1})`);
          delete updatePayload[badCol];
        } else {
          break;
        }
      }
      if (updateError) {
        console.error('❌ Tenant update failed:', JSON.stringify(updateError));
      }
    } else {
      await db.from('tenants')
        .update({ last_auto_reply_at: new Date().toISOString() })
        .eq('id', tenantId);
    }

    // Summarize conversation if it's getting long
    summarizeConversationIfNeeded(db, user.id, tenantId).catch(err =>
      console.error('Summary generation failed (non-blocking):', err)
    );

    return NextResponse.json({
      success: true,
      tenantId,
      isNewTenant: isNew,
      aiResponse: finalResponse,
      analysis: {
        action: analysis.action,
        intent: analysis.intent,
        priority: analysis.priority,
        thought_process: analysis.thought_process,
        extractedData: analysis.extractedData,
        summary: analysis.summary,
        escalation_reason: analysis.escalation_reason,
        listing_addresses: analysis.listing_addresses,
      },
      matchedProperties: matchedProperties.map(p => ({
        id: p.id,
        address: p.address,
        price: p.price_monthly || p.price,
        beds: p.beds ?? p.bedrooms,
        baths: p.baths ?? p.bathrooms,
        sqft: p.sqft,
        type: p.type,
        image: p.images?.[0] || p.image,
        city: p.city,
        state: p.state,
      })),
      booking: analysis.action === 'book_calendar' ? {
        success: executionResult.success,
        calendarLink: executionResult.data?.htmlLink,
        appointmentSaved,
        error: executionResult.error,
      } : null,
      hallucinationBlocked,
      guardrails: {
        blocked: guardrailResult.blocked,
        rewritten: guardrailResult.rewritten,
        checks: guardrailResult.results.map(r => ({ name: r.name, verdict: r.verdict, reason: r.reason })),
      },
      pipeline: pipelineStages,
      timing: { totalMs: Date.now() - t0 },
    });

  } catch (error: any) {
    console.error('Simulate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
