import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  calculateLeadScore,
  getLeadQuality,
  flattenExtractedData,
  getRankedPropertyMatches,
  scorePropertyMatch,
  validateBookingAction,
  cleanMessageForHistory,
  extractKnownFields,
  runAgentPipeline,
  type AgentResult,
} from '@/lib/ai-qualification';
import type { AiAnalysis } from '@/lib/ai/types';
import { runGuardrailPipeline } from '@/lib/ai/guardrails';
import { getOAuthTokens } from '@/lib/oauth-tokens';
import { aiLogger, traceAiCall, recordSystemEvent } from '@/lib/observability';
import { loadConversationMemory, summarizeConversationIfNeeded } from '@/lib/ai/memory';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.tenantId;
    const log = aiLogger.child({ route: 'auto-reply', userId: user.id, tenantId });

    // 1. Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 2. Load conversation memory (summary + recent messages)
    const memory = await loadConversationMemory(supabase, user.id, tenantId);

    const conversationHistory =
      memory.recentMessages.map((msg) => ({
        role: msg.sender_type === 'tenant' ? ('user' as const) : ('assistant' as const),
        content: cleanMessageForHistory(msg.message_text),
      }));

    // 3. Get realtor's available properties
    const { data: properties } = await supabase
      .from('properties')
      .select('*, building:buildings(id, name, amenities, rules, pet_policy, parking_type, walk_score, transit_score)')
      .eq('user_id', user.id)
      .in('status', ['Active', 'Available']);

    // 4. Get realtor info
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const realtorName    = user.user_metadata?.ai_signature_name || user.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Agent';
    const realtorPhone   = user.user_metadata?.ai_phone || user.user_metadata?.phone || user.phone;
    const realtorCompany = user.user_metadata?.company || user.user_metadata?.brokerage_name || '';
    const timezone       = user.user_metadata?.timezone || 'America/Los_Angeles';
    const viewingHoursStart = user.user_metadata?.viewing_hours_start || '10:00';
    const viewingHoursEnd   = user.user_metadata?.viewing_hours_end   || '20:00';

    // 5. Pre-compute ranked matches for context
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
    const maxResults = alreadyShownAddresses.length > 0 ? 5 : 3;

    const preFlatTenant = { ...(tenant || {}) };
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
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        qualification_status: tenant.qualification_status as any,
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
      knownFields: extractKnownFields(tenant),
      oauthRefreshToken: oauthRow?.refresh_token,
      preRankedMatches: preRankedMatches.length > 0 ? preRankedMatches : undefined,
    };

    // 6. Run Agent Pipeline (with tracing)
    let agentResult: AgentResult;
    try {
      agentResult = await traceAiCall(
        {
          userId: user.id,
          tenantId,
          trigger: 'manual',
          promptText: conversationHistory.map(m => m.content).join('\n').slice(0, 2000),
        },
        () => runAgentPipeline(context)
      );
    } catch (err: any) {
      log.error({ err }, 'Agent pipeline failed');
      const firstName = (tenant.name || 'there').split(' ')[0];
      agentResult = {
        responseText: `Hi ${firstName}, thanks for your message! I'm reviewing the details and will get back to you shortly.`,
        action: 'reply',
        extractedData: null,
        listingAddresses: [],
        photoMode: false,
        actionParams: null,
        escalationReason: null,
        humanActionRequests: [],
        toolsUsed: [],
        thoughtProcess: 'Agent pipeline error — fallback',
      };
    }

    // Convert to AiAnalysis for backward compat
    const analysis: AiAnalysis = {
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
    let finalResponse = agentResult.responseText;

    // 7. Guardrail: validate booking before execution
    if (analysis.action === 'book_calendar') {
      const validation = validateBookingAction(analysis, conversationHistory);
      if (!validation.valid) {
        console.log('🛡️ Guardrail override: book_calendar → reply');
        analysis.action = 'reply';
        analysis.action_params = undefined;
      }
    }

    // 8. Calendar event is now created by dispatcher; save appointment to DB
    let executionResult: { success: boolean; data?: any; error?: string } = { success: true };
    if (analysis.action === 'book_calendar' && analysis.action_params) {
      try {
        const args = analysis.action_params;
        const startTimeStr = (args.start_time || '').replace(/Z$/i, '').replace(/[+-]\d{2}:\d{2}$/, '').replace(/\.\d{3}$/, '');
        const duration = args.duration_minutes || 30;
        const endDate = new Date(new Date(startTimeStr).getTime() + duration * 60000);
        const endTimeStr = endDate.toISOString().replace(/Z$/i, '').replace(/\.\d{3}$/, '');

        await supabase.from('appointments').insert({
          user_id: user.id,
          tenant_id: tenant.id,
          property_id: properties?.find((p: any) => p.address === args.property_address)?.id || null,
          title: `Viewing: ${args.property_address}`,
          start_time: startTimeStr,
          end_time: endTimeStr,
          description: `Client: ${args.client_name || tenant.name}\nPhone: ${tenant.phone}\nEmail: ${tenant.email}`,
          status: 'confirmed',
        });
        executionResult = { success: true };
      } catch (err: any) {
        console.error('❌ Appointment save failed:', err);
        executionResult = { success: false, error: err.message };
      }
    }

    // 9. Resolve property cards
    const flatTenant = { ...tenant, ...flattenExtractedData(analysis.extractedData) };
    if (flatTenant.preferred_city && !flatTenant.preferred_state && properties?.length) {
      const { inferStateFromProperties } = await import('@/lib/ai-qualification');
      const inferred = inferStateFromProperties(flatTenant.preferred_city, properties);
      if (inferred) flatTenant.preferred_state = inferred.toUpperCase();
    }

    let rankedMatches: ReturnType<typeof getRankedPropertyMatches> = [];
    if (analysis.action === 'send_listing' && properties?.length) {
      const aiAddresses = (analysis.listing_addresses ?? []).filter(Boolean);
      if (aiAddresses.length > 0) {
        const resolved = aiAddresses
          .map((addr: string) => {
            const addrLow = addr.toLowerCase().trim();
            return properties.find((p: any) => {
              const pAddr = (p.address || '').toLowerCase();
              return pAddr === addrLow || pAddr.includes(addrLow) || addrLow.includes(pAddr);
            });
          })
          .filter(Boolean) as any[];
        if (resolved.length > 0) {
          const scored = resolved.map((p: any) => {
            const r = scorePropertyMatch(flatTenant, p);
            return { property: p, ...r };
          });
          rankedMatches = scored.filter(r => !r.disqualified);
          if (rankedMatches.length === 0) {
            rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults });
          }
        } else {
          rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults });
        }
      } else {
        rankedMatches = getRankedPropertyMatches(flatTenant, properties, { maxResults });
      }
    }
    const matchedProperties = rankedMatches.map(r => r.property);

    // 10. Guardrails pipeline
    const guardrailResult = runGuardrailPipeline(
      {
        responseText: finalResponse,
        agentResult,
        properties: matchedProperties.length > 0 ? (matchedProperties as any) : (properties || []),
        conversationHistory,
        tenantEmail: tenant.email,
      },
      (tenant.name || 'there').split(' ')[0]
    );

    if (guardrailResult.blocked || guardrailResult.rewritten) {
      const failedChecks = guardrailResult.results.filter(r => r.verdict !== 'pass');
      for (const check of failedChecks) {
        log.warn({ guardrail: check.name, reason: check.reason, verdict: check.verdict }, 'Guardrail triggered');
      }
      if (guardrailResult.blocked) {
        await recordSystemEvent({
          userId: user.id,
          eventType: 'guardrail_blocked',
          status: 'error',
          metadata: { tenantId, checks: failedChecks.map(c => ({ name: c.name, reason: c.reason })) },
        });
        analysis.action = 'reply';
      }
    }
    finalResponse = guardrailResult.finalText;

    // 11. Trigger conversation summarization in background
    summarizeConversationIfNeeded(supabase, user.id, tenantId)
      .catch(err => aiLogger.warn({ err, tenantId }, 'Background summarization failed'));

    // 12. Footer
    const AI_DISCLAIMER = '\n\n---\nThis message was generated by an AI leasing assistant. A licensed human agent is available upon request.\nWe are an Equal Housing Opportunity provider. \u00A9 Equal Housing Opportunity.';
    const finalResponseWithFooter = finalResponse + AI_DISCLAIMER;

    return NextResponse.json({
      success: true,
      aiResponse: finalResponseWithFooter,
      extractedData: analysis.extractedData,
      leadScore: tenant.lead_score,
      leadQuality: tenant.lead_quality,
      matchedProperties: matchedProperties.slice(0, 5),
      nextAction: analysis.action,
      listingAddresses: analysis.listing_addresses,
      guardrails: {
        blocked: guardrailResult.blocked,
        rewritten: guardrailResult.rewritten,
        checks: guardrailResult.results.map(r => ({ name: r.name, verdict: r.verdict, reason: r.reason })),
      },
    });

  } catch (error: any) {
    aiLogger.error({ err: error, tenantId: params.tenantId }, 'Auto-reply endpoint failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
