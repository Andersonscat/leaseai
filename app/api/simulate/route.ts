import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {
  analyzeAndRespond,
  verifyResponseHallucinations,
  calculateLeadScore,
  getLeadQuality,
  formatBookingDetails,
} from '@/lib/ai-qualification';
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
      { data: previousMessages },
      { data: tenantRow },
    ] = await Promise.all([
      db.from('properties').select('*').eq('user_id', user.id)
        .is('deleted_at', null),
      db.from('messages').select('message_text, sender_type')
        .eq('tenant_id', tenantId).eq('user_id', user.id)
        .order('created_at', { ascending: true }).limit(10),
      db.from('tenants').select('*').eq('id', tenantId).single(),
    ]);

    console.log(`🏠 Properties loaded: ${properties?.length ?? 0}. Addresses: ${properties?.map(p => `${p.address} [status=${p.status}, price=${p.price_monthly || p.price}, img=${p.images?.[0] ? (String(p.images[0]).startsWith('http') ? 'URL' : String(p.images[0]).substring(0, 15) + '...') : 'NONE'}]`).join(' | ') || 'none'}`);

    const conversationHistory = (previousMessages || []).map(msg => ({
      role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
      content: msg.message_text,
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
      realtorName,
      realtorPhone,
      realtorCompany,
      timezone,
      viewingHoursStart,
      viewingHoursEnd,
    };

    // ─── BRAIN + VOICE: Single Gemini call ──────────────────────────────
    t1 = Date.now();
    const { analysis, reply } = await analyzeAndRespond(context);
    const fallbackReply = `Hi ${(tenantRow?.name || name).split(' ')[0]}, thank you for your message! I'm reviewing the details and will get back to you shortly.`;
    let finalResponseText = reply?.trim() || fallbackReply;
    console.log(`🧠 AI reply length=${reply?.length ?? 'null'}, finalResponseText length=${finalResponseText.length}, action=${analysis.action}`);
    pipelineStages.push({ stage: 'brain', durationMs: Date.now() - t1, detail: `action=${analysis.action}` });

    // ─── HAND: Execute Actions ──────────────────────────────────────────
    t1 = Date.now();
    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };
    let appointmentSaved = false;

    if (analysis.action === 'book_calendar' && analysis.action_params) {
      try {
        const oauthRow = await getOAuthTokens(user.id);
        if (oauthRow) {
          const { createCalendarEvent } = await import('@/lib/calendar-client');
          const args = analysis.action_params;
          const startTimeStr = args.start_time
            .replace(/Z$/i, '')
            .replace(/[+-]\d{2}:\d{2}$/, '')
            .replace(/\.\d{3}$/, '');

          const duration = args.duration_minutes || 30;
          const startAsUtc = new Date(startTimeStr + 'Z');
          const endAsUtc = new Date(startAsUtc.getTime() + duration * 60000);
          const endTimeStr = endAsUtc.toISOString().slice(0, 19);

          const event = await createCalendarEvent(
            oauthRow.refresh_token,
            startTimeStr,
            endTimeStr,
            `Viewing: ${args.property_address}`,
            `Client: ${args.client_name || name}\nPhone: ${phone || 'N/A'}\nEmail: ${email}`,
            email
          );
          executionResult = { success: true, data: event };

          await db.from('appointments').insert({
            user_id: user.id,
            tenant_id: tenantId,
            property_id: properties?.find(p => p.address === args.property_address)?.id || null,
            title: `Viewing: ${args.property_address}`,
            start_time: startTimeStr,
            end_time: endTimeStr,
            description: `Client: ${args.client_name || name}\nPhone: ${phone || 'N/A'}\nEmail: ${email}`,
            google_event_id: event.id,
            google_event_link: event.htmlLink,
            status: 'confirmed',
          });
          appointmentSaved = true;
        } else {
          executionResult = {
            success: true,
            data: { htmlLink: '(Calendar not connected — simulated)', id: 'sim-' + Date.now() },
          };
        }
      } catch (err: any) {
        console.error('Simulate: calendar error:', err);
        executionResult = { success: false, error: err.message };
      }
    }
    pipelineStages.push({ stage: 'hand', durationMs: Date.now() - t1, detail: analysis.action === 'book_calendar' ? 'calendar' : 'none' });

    // ─── JUDGE: Deterministic Anti-Hallucination ────────────────────────
    t1 = Date.now();
    const verification = await verifyResponseHallucinations(finalResponseText, properties || []);
    let hallucinationBlocked = false;
    if (verification.hasHallucinations) {
      finalResponseText = `Hi ${(tenantRow?.name || name).split(' ')[0]}, I'm currently checking our inventory to confirm the exact details of matching properties. I will get back to you very shortly with accurate information!`;
      analysis.action = 'reply';
      hallucinationBlocked = true;
    }
    pipelineStages.push({ stage: 'judge', durationMs: Date.now() - t1, detail: hallucinationBlocked ? 'blocked' : 'passed' });

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

    // ─── ATTACH PROPERTY CARDS IF LISTING ───────────────────────────────
    const listingAddresses = analysis.listing_addresses || [];
    const propertyMatches = analysis.propertyMatches || [];
    console.log(`🏠 AI listing_addresses: ${JSON.stringify(listingAddresses)}`);
    console.log(`🏠 AI propertyMatches: ${JSON.stringify(propertyMatches)}`);

    let matchedProperties: any[] = [];
    if ((analysis.action === 'send_listing' || listingAddresses.length > 0) && properties?.length) {
      if (listingAddresses.length > 0) {
        matchedProperties = properties.filter(p =>
          listingAddresses.some((addr: string) => p.address?.toLowerCase().includes(addr.toLowerCase()))
        );
      } else if (analysis.suggestedProperties?.length) {
        matchedProperties = properties.filter(p =>
          analysis.suggestedProperties!.some((sp: string) => p.address?.toLowerCase().includes(sp.toLowerCase()))
        );
      } else {
        matchedProperties = properties.slice(0, 3);
      }

      // Fallback: if AI referenced addresses but matching failed, use propertyMatches scores
      if (matchedProperties.length === 0 && propertyMatches.length > 0) {
        const topAddresses = propertyMatches
          .filter((m: any) => m.score >= 55)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5)
          .map((m: any) => m.address);
        matchedProperties = properties.filter(p =>
          topAddresses.some((addr: string) => p.address?.toLowerCase().includes(addr.toLowerCase()))
        );
      }
      console.log(`🏠 Matched ${matchedProperties.length} properties: ${matchedProperties.map(p => p.address).join(' | ')}`);
    }

    let dbMessageText = finalResponse;
    if (!dbMessageText?.trim()) {
      console.error('🚨 EMPTY AI RESPONSE DETECTED — using fallback. reply was:', JSON.stringify(reply), 'finalResponseText was:', JSON.stringify(finalResponseText));
      dbMessageText = fallbackReply;
    }
    if (matchedProperties.length > 0) {
      const getImageUrl = (p: any): string | null => {
        const imgs = Array.isArray(p.images) ? p.images : [];
        for (const img of imgs) {
          const url = typeof img === 'string' ? img : img?.url;
          if (url && typeof url === 'string' && url.startsWith('http')) return url;
        }
        if (typeof p.image === 'string' && p.image.startsWith('http')) return p.image;
        if (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http')) return p.thumbnail;
        return null;
      };
      const cleanProps = matchedProperties.slice(0, 5).map(p => {
        const imgUrl = getImageUrl(p);
        console.log(`  📸 ${p.address}: image=${imgUrl ? 'URL' : 'NULL'}, images type=${typeof p.images}, images[0] type=${typeof p.images?.[0]}, starts=${String(p.images?.[0]).substring(0, 40)}`);
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
          image: imgUrl,
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
          ? properties?.find(p => p.address === analysis.action_params.property_address)?.id
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
      if (ed.housing?.furnished) updateData.furnishing = ed.housing.furnished;
      if (Array.isArray(ed.housing?.property_types) && ed.housing.property_types.length > 0) updateData.property_type = ed.housing.property_types[0];
      if (ed.occupants?.total_count != null) updateData.num_occupants = ed.occupants.total_count;
      if (ed.pets?.has_pets !== undefined) updateData.has_pets = ed.pets.has_pets;
      if (ed.pets && Object.keys(ed.pets).length > 0) updateData.pet_details = ed.pets;
      if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) updateData.must_haves = ed.amenities.desired_features;
      if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) updateData.deal_breakers = ed.amenities.deal_breakers;
      if (ed.amenities?.parking?.required === 'required') updateData.needs_parking = true;
      if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) updateData.preferred_neighborhoods = ed.location.neighborhoods_must;

      const score = calculateLeadScore({ ...(tenantRow || {}), ...updateData });
      updateData.lead_score = score;
      updateData.lead_quality = analysis.priority || getLeadQuality(score);
      if (score >= 60) updateData.qualification_status = 'qualified';
      else if (score >= 30) updateData.qualification_status = 'qualifying';

      let { error: updateError } = await db.from('tenants').update(updateData).eq('id', tenantId);

      if (updateError?.code === '42703') {
        const basicUpdate: any = { last_auto_reply_at: new Date().toISOString() };
        if (updateData.move_in_date) basicUpdate.move_in_date = updateData.move_in_date;
        await db.from('tenants').update(basicUpdate).eq('id', tenantId);
      }
    } else {
      await db.from('tenants')
        .update({ last_auto_reply_at: new Date().toISOString() })
        .eq('id', tenantId);
    }

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
      pipeline: pipelineStages,
      timing: { totalMs: Date.now() - t0 },
    });

  } catch (error: any) {
    console.error('Simulate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
