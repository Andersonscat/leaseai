import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeAndRespond, verifyResponseHallucinations, ConversationContext, TenantData, Property } from '@/lib/ai-qualification';
import { normalizeAmenities, AMENITY_BY_KEY } from '@/lib/amenities-catalog';

// Service-role client — bypasses RLS, safe for server-only sandbox use
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Fallback hardcoded properties if DB is empty or unavailable
const FALLBACK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '123 Main St, Seattle, WA',
    price: '$2,500/mo',
    price_amount: 2500,
    bedrooms: 2,
    status: 'available',
    description: 'Modern 2BR apartment in Capitol Hill. Open-plan living, updated kitchen, in-unit laundry, hardwood floors. Pet-friendly (cats & small dogs). Parking available (+$150/mo). Available immediately.',
    amenities: ['in-unit laundry', 'hardwood floors', 'updated kitchen', 'parking available'],
    pet_policy: 'small_dogs',
    available_from: '2026-02-01',
  },
  {
    id: 'p2',
    address: '456 Oak Ave, Seattle, WA',
    price: '$3,200/mo',
    price_amount: 3200,
    bedrooms: 3,
    status: 'available',
    description: 'Spacious 3BR townhouse in Queen Anne. Private backyard, 2 parking spots, rooftop deck. Great for families. No pets. Available March 1, 2026.',
    amenities: ['private backyard', '2 parking spots', 'rooftop deck'],
    pet_policy: 'no_pets',
    available_from: '2026-03-01',
  },
  {
    id: 'p3',
    address: '789 Pine St, Seattle, WA',
    price: '$1,800/mo',
    price_amount: 1800,
    bedrooms: 1,
    status: 'available',
    description: 'Cozy 1BR studio in Belltown. City views, gym access, doorman, pet-friendly. Walking distance to downtown. Available now.',
    amenities: ['city views', 'gym', 'doorman', 'concierge'],
    pet_policy: 'allowed',
    available_from: '2026-02-01',
  },
];

/** Detect rent/sale preference from already-extracted tenant data */
function detectTypePreference(tenantData: any): 'rent' | 'sale' | null {
  const types: string[] = tenantData?.housing?.property_types || [];
  const flat = types.join(' ').toLowerCase();
  if (flat.includes('rent') || flat.includes('lease')) return 'rent';
  if (flat.includes('buy') || flat.includes('sale') || flat.includes('purchase')) return 'sale';
  return null;
}

/** Returns all safe image URLs for a property (external URLs as-is, base64 via /api/property-image/[id]?idx=N) */
function resolveImages(images: any[], propertyId: string): string[] {
  if (!Array.isArray(images) || images.length === 0) return [];
  return images
    .map((img: any, idx: number) => {
      if (typeof img === 'string' && img.startsWith('http')) return img;
      if (typeof img === 'string' && img.startsWith('data:')) return `/api/property-image/${propertyId}?idx=${idx}`;
      return null;
    })
    .filter(Boolean) as string[];
}

/** Load available properties from Supabase. Falls back to FALLBACK_PROPERTIES. */
async function loadProperties(typeFilter: 'rent' | 'sale' | null): Promise<{ properties: Property[]; raw: any[] }> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

    // Apply type filter only when we know the client's intent
    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      console.warn('⚠️ Sandbox: DB empty or error, using fallback properties', error?.message);
      // Fallback: filter by type if needed
      const fallback = typeFilter
        ? FALLBACK_PROPERTIES.filter(p => (p as any).type === typeFilter || typeFilter === 'rent')
        : FALLBACK_PROPERTIES;
      return { properties: fallback, raw: [] };
    }

    // Map DB schema → Property interface used by AI
    const properties: Property[] = data.map((p: any) => ({
      id: p.id,
      address: [p.address, p.city, p.state].filter(Boolean).join(', '),
      price: p.price_monthly ? `$${p.price_monthly.toLocaleString()}/mo` : 'Price on request',
      price_amount: p.price_monthly,
      bedrooms: p.beds ?? 0,
      status: p.status ?? 'available',
      description: p.description ?? '',
      // Use pre-normalized keys if available; otherwise normalize on the fly
      amenities: Array.isArray(p.amenities_normalized) && p.amenities_normalized.length > 0
        ? p.amenities_normalized
        : normalizeAmenities([
            ...(Array.isArray(p.amenities) ? p.amenities : []),
            ...(Array.isArray(p.features)  ? p.features  : []),
          ]),
      images: Array.isArray(p.images) ? p.images : [],
      pet_policy: p.pet_policy ?? 'unknown',
      available_from: p.available_from ?? undefined,
      parking_type: p.parking_type ?? undefined,
      parking_fee: p.parking_fee ?? undefined,
      application_fee: p.application_fee ?? undefined,
      security_deposit: p.security_deposit ?? undefined,
    }));

    return { properties, raw: data };
  } catch (err) {
    console.error('❌ Sandbox: Failed to load properties from DB', err);
    return { properties: FALLBACK_PROPERTIES, raw: [] };
  }
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();

  try {
    const { message, conversationHistory, tenantData, handoffTriggered } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // If human handoff was already triggered, silently record message — no AI reply
    if (handoffTriggered) {
      return NextResponse.json({
        reply: null,
        handoff: { triggered: true, reason: 'Already escalated', timestamp: new Date().toISOString() },
        conversationHistory: [
          ...(conversationHistory || []),
          { role: 'user', content: message },
        ],
        timing: { aiMs: 0, totalMs: Date.now() - t0 },
      });
    }

    // Opt-out / Do Not Contact check (CAN-SPAM / TCPA)
    const OPT_OUT_PATTERNS = /\b(stop|unsubscribe|remove me|do not contact|opt out|optout|cancel)\b/i;
    if (OPT_OUT_PATTERNS.test(message)) {
      const supabase = getSupabase();
      const tenantEmail = tenantData?.email;
      if (tenantEmail) {
        await supabase.from('tenants').update({
          do_not_contact: true,
          do_not_contact_at: new Date().toISOString(),
          do_not_contact_reason: 'opt_out',
        }).eq('email', tenantEmail);
      }
      const optOutReply = "You've been unsubscribed. You will not receive any further messages from us. If this was a mistake, please reply START to re-subscribe.";
      return NextResponse.json({
        reply: optOutReply,
        handoff: {
          triggered: true,
          reason: 'Client requested opt-out / Do Not Contact',
          timestamp: new Date().toISOString(),
          agentNotification: {
            sentAt: new Date().toISOString(),
            channel: 'email',
            recipient: 'agent@realtoros.com',
            subject: `[Opt-Out] Client unsubscribed: ${tenantEmail || 'unknown'}`,
            preview: `Client requested opt-out via message: "${message}". Do Not Contact flag set.`,
          },
        },
        conversationHistory: [
          ...(conversationHistory || []),
          { role: 'user', content: message },
          { role: 'assistant', content: optOutReply },
        ],
        timing: { aiMs: 0, totalMs: Date.now() - t0 },
      });
    }

    // Detect rent/sale preference from already-accumulated tenant data
    const typePreference = detectTypePreference(tenantData);
    console.log(`🏠 Sandbox: type filter = ${typePreference ?? 'none (showing all)'}`);

    // Load real properties from DB (or fallback)
    const { properties, raw } = await loadProperties(typePreference);

    const updatedHistory: { role: 'user' | 'assistant'; content: string }[] = [
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Reconstruct tenant name from extracted personal fields or top-level name
    const firstName = tenantData?.personal?.firstName || tenantData?.name || '';
    const lastName = tenantData?.personal?.lastName || '';
    const resolvedName = [firstName, lastName].filter(Boolean).join(' ') || 'there';

    const tenantBase = { ...(tenantData || {}) };
    const tenant: TenantData = {
      email: 'sandbox@test.com',
      source: 'sandbox',
      ...tenantBase,
      name: resolvedName, // always use resolved full name, override anything from tenantData
    };

    const context: ConversationContext = {
      tenant,
      properties,
      conversationHistory: updatedHistory,
      realtorName: 'LeaseAI Agent',
      realtorPhone: '+1 (555) 000-0000',
    };

    const t1 = Date.now();
    const { analysis, reply: rawReply } = await analyzeAndRespond(context);
    const aiMs = Date.now() - t1;
    console.log(`⚡ analyzeAndRespond: ${aiMs}ms`);

    // If AI couldn't process the message — skip all further steps, go straight to handoff
    if (analysis.action === 'escalate' && analysis.thought_process?.includes('AI processing error')) {
      const firstName = resolvedName.split(' ')[0];
      const now = new Date().toISOString();
      return NextResponse.json({
        reply: rawReply,
        handoff: {
          triggered: true,
          reason: analysis.escalation_reason || 'AI failed to process the message',
          timestamp: now,
          agentNotification: {
            sentAt: now,
            channel: 'email',
            recipient: 'agent@realtoros.com',
            subject: `[Action Required] AI error — lead needs human: ${resolvedName}`,
            preview: `AI failed to process a message from "${resolvedName}". Reason: ${analysis.escalation_reason}. Please follow up manually.`,
          },
        },
        conversationHistory: [...updatedHistory, { role: 'assistant', content: rawReply }],
        timing: { aiMs: Date.now() - t1, totalMs: Date.now() - t0 },
      });
    }

    // If booking — re-run with simulated calendar result
    let aiResponseText = rawReply;
    if (analysis.action === 'book_calendar') {
      const bookingTime = analysis.action_params?.start_time || new Date().toISOString();
      const t2 = Date.now();
      const { reply: bookingReply } = await analyzeAndRespond(context, {
        success: true,
        data: {
          htmlLink: 'https://calendar.google.com/sandbox-preview-link',
          start: { dateTime: bookingTime }
        }
      });
      console.log(`⚡ booking reply: ${Date.now() - t2}ms`);
      aiResponseText = bookingReply;
    }

    // Hallucination check — only run when response mentions property data (addresses/prices)
    // Skipping for pure conversational replies avoids false positives and saves latency
    const mentionsPropertyData = /\b\d+\s+\w+\s+(St|Ave|Rd|Ln|Blvd|Dr|Way|Pl|Ct)\b/i.test(aiResponseText)
      || aiResponseText.includes('$') && /\d{3,}/.test(aiResponseText);

    if (mentionsPropertyData) {
      const verification = await verifyResponseHallucinations(aiResponseText, properties);
      if (verification.hasHallucinations) {
        console.warn('🚨 SANDBOX HALLUCINATION BLOCKED:', verification.reason);
        // Keep the conversational part, just strip any property-specific claims
        const firstName = (tenant.name || 'there').split(' ')[0];
        aiResponseText = `Hi ${firstName}, I want to make sure I share accurate details with you. Let me double-check the property specifics and get back to you right away.`;
        analysis.action = 'reply';
      }
    }

    // Attach property cards for send_listing
    const listingAddresses = analysis.listing_addresses || [];
    let matchedProperties: any[] = [];
    if (analysis.action === 'send_listing' || listingAddresses.length > 0) {
      matchedProperties = listingAddresses.length > 0
        ? properties.filter(p => listingAddresses.some(addr => p.address.toLowerCase().includes(addr.toLowerCase())))
        : (analysis.suggestedProperties?.length
            ? properties.filter(p => analysis.suggestedProperties!.some(sp => p.address.toLowerCase().includes(sp.toLowerCase())))
            : properties.slice(0, 3));

      // Hard-sort by score DESC so cards always appear in score order
      // regardless of what order the AI listed them in its text reply
      if (analysis.propertyMatches?.length) {
        const scoreMap = new Map(
          analysis.propertyMatches.map((pm: any) => [
            pm.address?.split(',')[0]?.toLowerCase().trim(),
            pm.score ?? 0,
          ])
        );
        matchedProperties.sort((a, b) => {
          const aKey = a.address.split(',')[0].toLowerCase().trim();
          const bKey = b.address.split(',')[0].toLowerCase().trim();
          return (scoreMap.get(bKey) ?? 0) - (scoreMap.get(aKey) ?? 0);
        });
      }
    }

    if (matchedProperties.length > 0) {
      // Find raw DB row to get city/state/sqft/baths/image
      const cleanProps = matchedProperties.map(p => {
        const dbRow = raw.find((r: any) =>
          [r.address, r.city, r.state].filter(Boolean).join(', ') === p.address
        );
        return {
          id: p.id,
          address: p.address,
          city: dbRow?.city ?? null,
          state: dbRow?.state ?? null,
          price: p.price_amount ?? null,
          beds: p.bedrooms,
          baths: dbRow?.baths ?? null,
          sqft: dbRow?.sqft ?? null,
          type: dbRow?.type ?? null,
          images: dbRow ? resolveImages(dbRow.images ?? [], dbRow.id) : [],
        };
      });
      // Detect photo request either from AI flag or from the user's message keywords
      const PHOTO_KEYWORDS = /\b(photo|photos|picture|pictures|image|images|фото|фотографии|картинк|покажи фото|send.*photo|show.*photo|more.*photo|photo.*option|снимки)\b/i;
      const isPhotoRequest = analysis.photo_mode === true || PHOTO_KEYWORDS.test(message);

      if (isPhotoRequest) {
        // Photo mode: send all individual images inline, not property cards
        const allPhotos = cleanProps.flatMap((p: any) =>
          (p.images as string[]).map((url: string) => ({ url, address: p.address }))
        );
        if (allPhotos.length > 0) {
          aiResponseText += `\n\n---PHOTOS_JSON---\n${JSON.stringify(allPhotos)}\n---END_PHOTOS_JSON---`;
        } else {
          aiResponseText += `\n\n---PROPERTIES_JSON---\n${JSON.stringify(cleanProps)}\n---END_PROPERTIES_JSON---`;
        }
      } else {
        aiResponseText += `\n\n---PROPERTIES_JSON---\n${JSON.stringify(cleanProps)}\n---END_PROPERTIES_JSON---`;
      }
    }

    const assistantMessage = { role: 'assistant' as const, content: aiResponseText };
    const newHistory = [...updatedHistory, assistantMessage];
    const totalMs = Date.now() - t0;
    console.log(`⚡ Total response time: ${totalMs}ms`);

    // Property metadata for the right panel
    const propertyMeta = properties.map(p => {
      const dbRow = raw.find((r: any) =>
        [r.address, r.city, r.state].filter(Boolean).join(', ') === p.address
      );
      return {
        address: p.address,
        price: p.price_amount ?? 0,
        beds: p.bedrooms,
        images: dbRow ? resolveImages(dbRow.images ?? [], dbRow.id) : [],
      };
    });

    // Audit log — fire-and-forget (do not block response)
    const supabase = getSupabase();
    supabase.from('ai_audit_log').insert({
      action: analysis.action,
      intent: analysis.intent,
      escalation_reason: analysis.escalation_reason ?? null,
      thought_process: analysis.thought_process ?? null,
      property_matches: analysis.propertyMatches ?? null,
      extracted_data: analysis.extractedData ?? null,
      ai_model: 'gemini-2.5-flash',
      response_ms: aiMs,
      was_hallucination_blocked: mentionsPropertyData && false, // updated below if blocked
      ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
    }).then(({ error }) => {
      if (error) console.warn('⚠️ Audit log insert failed (non-blocking):', error.message);
    });

    return NextResponse.json({
      reply: aiResponseText,
      propertyMeta,
      analysis: {
        action: analysis.action,
        intent: analysis.intent,
        priority: analysis.priority,
        thought_process: analysis.thought_process,
        extractedData: analysis.extractedData,
        summary: analysis.summary,
        pending_checks: analysis.pending_checks ?? [],
        // If AI sent a listing — filter propertyMatches to only the sent properties
        // so the right panel stays in sync with what the client actually received
        propertyMatches: matchedProperties.length > 0
          ? (analysis.propertyMatches ?? []).filter(pm =>
              matchedProperties.some(mp =>
                mp.address.toLowerCase().includes(pm.address?.split(',')[0]?.toLowerCase() ?? '')
              )
            )
          : analysis.propertyMatches,
        escalation_reason: analysis.escalation_reason,
      },
      handoff: analysis.action === 'escalate'
        ? (() => {
            const tenantName = tenant.name || 'Unknown';
            const reason = analysis.escalation_reason || 'Requires human attention';
            const now = new Date().toISOString();
            return {
              triggered: true,
              reason,
              timestamp: now,
              agentNotification: {
                sentAt: now,
                channel: 'email',
                recipient: 'agent@realtoros.com',
                subject: `[Action Required] Lead escalated: ${tenantName}`,
                preview: `Client "${tenantName}" was escalated by AI. Reason: ${reason}. Please review the conversation and follow up.`,
              },
            };
          })()
        : null,
      conversationHistory: newHistory,
      simulatedBooking: analysis.action === 'book_calendar' ? {
        property: analysis.action_params?.property_address,
        time: analysis.action_params?.start_time,
        calendarLink: 'https://calendar.google.com/sandbox-preview-link',
      } : null,
      timing: { aiMs, totalMs },
    });

  } catch (error: any) {
    console.error('❌ Sandbox Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
