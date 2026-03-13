import { geminiModel, generateContentWithRetry } from '@/lib/gemini-client';
import { ALL_AMENITY_KEYS } from '@/lib/amenities-catalog';
import { geminiFlashModel, geminiJsonModel } from '@/lib/ai/models';
import type { ConversationContext, AiAnalysis, BrainResult } from '@/lib/ai/types';

// ─── Shared helpers ─────────────────────────────────────────────────────────

function buildPreRankedSection(context: ConversationContext): string {
  if (!context.preRankedMatches?.length) return '';
  return `\nPRE-RANKED MATCHES (properties the system selected for this client, in order):
${context.preRankedMatches.map((m, i) => `Option ${i + 1}: ${m.address} — score ${m.score}/100 — $${m.price}/mo, ${m.beds ?? '?'}bd/${m.baths ?? '?'}ba (${m.reason})`).join('\n')}

RULES FOR PHOTO REQUESTS:
- "the option"/"that option" with only ONE previously shown → assume that property.
- "option 1"/"first option"/"the first one" → Option 1 address above.
- "option 2"/"second option"/"the second one" → Option 2 address above.
- "option 3"/"third option"/"the third one" → Option 3 address above.
- For photo requests: set action="send_listing", listing_addresses=[address], photo_mode=true.
- Only ask for clarification if 2+ properties shown AND genuinely ambiguous.
RULE: When recommending, use ONLY properties from the PRE-RANKED MATCHES list above, in order.
`;
}

function buildDateContext(): string {
  const now = new Date();
  return `${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;
}

function buildHistoryText(history: { role: string; content: string }[]): string {
  return history.map(m =>
    `${m.role === 'user' ? 'Client' : 'Agent'}: ${m.content}`
  ).join('\n');
}

function repairTruncatedJson(raw: string): any {
  let cleanText = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanText = jsonMatch[0];

  try {
    return JSON.parse(cleanText);
  } catch {
    console.error('⚠️ JSON truncated. Last 300 chars:', cleanText.slice(-300));
    let attempt = cleanText;
    let braces = 0; let brackets = 0;
    for (const ch of attempt) {
      if (ch === '{') braces++; else if (ch === '}') braces--;
      if (ch === '[') brackets++; else if (ch === ']') brackets--;
    }
    attempt += ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
    return JSON.parse(attempt);
  }
}

// ─── Property text builders ─────────────────────────────────────────────────

function buildMinimalPropertiesText(properties: ConversationContext['properties']): string {
  return properties.map(p => {
    const price = p.price_monthly || p.price;
    const beds = p.beds ?? p.bedrooms;
    return `- ${p.address}: $${price || '?'}/mo, ${beds ?? '?'}bd, pets=${p.pet_policy || 'unknown'}, available=${p.available_from || 'now'}`;
  }).join('\n');
}

function buildFullPropertiesText(properties: ConversationContext['properties']): string {
  return properties.map(p =>
    `- ${p.address}:
       Price: $${p.price_monthly || p.price || 'Unknown'}/month
       Beds: ${p.beds ?? p.bedrooms ?? 'Unknown'}
       Baths: ${p.baths ?? p.bathrooms ?? 'Unknown'}
       Sqft: ${p.sqft || 'Unknown'}
       Status: ${p.status}
       Description: ${p.description || 'N/A'}
       Available: ${p.available_from || 'Now'}
       Pets: ${p.pet_policy || 'Unknown'}
       Parking: ${p.parking_type || 'Unknown'} (${p.parking_fee ? '$'+p.parking_fee : 'included'})
       Utilities: ${p.utilities_included?.join(', ') || 'Tenant pays'}
       Fees: App $${p.application_fee || '0'}, Deposit $${p.security_deposit || '0'}
       Photos: ${p.images?.length ? p.images.length + ' available' : 'None'}`
  ).join('\n\n');
}

// ─── Lightweight Brain prompt ───────────────────────────────────────────────

function buildLightweightPrompt(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): string {
  const { tenant, conversationHistory } = context;
  const realtorName = context.realtorName || 'Agent';
  const timezone = context.timezone || 'America/Los_Angeles';
  const viewingStart = context.viewingHoursStart || '10:00';
  const viewingEnd = context.viewingHoursEnd || '20:00';
  const minimalProps = buildMinimalPropertiesText(context.properties);
  const historyText = buildHistoryText(conversationHistory);
  const isFirstMessage = !conversationHistory.some(m => m.role === 'assistant');
  const preRanked = buildPreRankedSection(context);

  const executionNote = executionResult?.success
    ? `\nCALENDAR BOOKING SUCCEEDED: link=${executionResult.data?.htmlLink}, time=${executionResult.data?.start?.dateTime}`
    : executionResult?.error
      ? `\nCALENDAR BOOKING FAILED: ${executionResult.error}`
      : '';

  return `You are a real estate leasing AI assistant's BRAIN module.
Your job is to ANALYZE the client's message and decide WHAT ACTION to take.
You do NOT write the reply text — another module handles that.
You output ONLY structured JSON.

QUALIFICATION RULES:
- TIER 1 (must collect before action="send_listing" or "book_calendar"):
  lease_duration, rent/buy, move_in_date, budget, occupants, pets, bedrooms
- If ANY Tier 1 field is missing → action="reply" (ask max 2 related questions).
- PASSIVE EXTRACTION: if the client already stated a value, extract it silently.
- Once all 7 are known → action="send_listing".
- Use amenity keys from: ${ALL_AMENITY_KEYS.join(', ')}

ESCALATION TRIGGERS:
- Opt-out/unsubscribe, legal/ADA issues, repeated failures, abusive language.

AVAILABLE PROPERTIES (addresses only — details are handled by the system):
${minimalProps || 'No properties available.'}
${preRanked}
CONTEXT:
REALTOR_NAME: ${realtorName}
Client: ${tenant.name} (${tenant.email || 'unknown'})
CURRENT DATE/TIME: ${buildDateContext()}
TIMEZONE: ${timezone}
VIEWING HOURS: ${viewingStart}–${viewingEnd} (${timezone})
IS_FIRST_MESSAGE: ${isFirstMessage}
${executionNote}

CONVERSATION:
${historyText}

TASK: Analyze the client's latest message. Return ONLY valid JSON (NO reply text):
{
  "thought_process": "Your internal reasoning",
  "intent": "general|inquiry|booking_confirmed",
  "action": "reply|send_listing|book_calendar|escalate",
  "action_params": { "start_time": "", "property_address": "", "client_name": "", "duration_minutes": 30 },
  "listing_addresses": [],
  "photo_mode": false,
  "extractedData": {
    "personal": { "firstName": "", "lastName": "" },
    "timeline": { "move_in_date": "", "lease_term_ideal_months": null },
    "budget": { "max_monthly_rent": null, "budget_stated": null, "budget_currency": "USD", "budget_usd": null },
    "housing": { "property_types": [], "bedrooms_min": null, "furnished": "" },
    "occupants": { "total_count": null },
    "pets": { "has_pets": null },
    "amenities": { "desired_features": [], "deal_breakers": [] },
    "location": { "city": "", "state": "", "neighborhoods_must": [] }
  },
  "summary": { "client": "", "interests": "", "concerns": "", "next_step": "" },
  "escalation_reason": null,
  "priority": "warm",
  "pending_checks": []
}

IMPORTANT:
- Only include extractedData fields actually found in this conversation.
- Do NOT include a "reply" field — the system generates the reply separately.
- listing_addresses must contain real addresses from the AVAILABLE PROPERTIES list above.
- Hard gate: if any of [lease_duration, property_types, move_in_date, budget_usd, total_count, has_pets, bedrooms_min] is missing → action="reply".`;
}

function buildCompactFallbackPrompt(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): string {
  const { tenant, conversationHistory } = context;
  const minimalProps = buildMinimalPropertiesText(context.properties);
  const isFirstMessage = !conversationHistory.some(m => m.role === 'assistant');
  const preRanked = buildPreRankedSection(context);
  const recentHistory = conversationHistory.slice(-6);
  const compactHistoryText = buildHistoryText(recentHistory);

  const executionNote = executionResult?.success
    ? `\nCALENDAR BOOKING SUCCEEDED: link=${executionResult.data?.htmlLink}, time=${executionResult.data?.start?.dateTime}`
    : executionResult?.error
      ? `\nCALENDAR BOOKING FAILED: ${executionResult.error}`
      : '';

  return `You are a real estate AI brain. Analyze the client message and return structured JSON (no reply text).

PROPERTIES: ${minimalProps || 'None'}
${preRanked}
Client: ${tenant.name} | Date: ${new Date().toLocaleDateString('en-US')}
IS_FIRST_MESSAGE: ${isFirstMessage}
${executionNote}

CONVERSATION:
${compactHistoryText}

Return JSON: {"action":"reply","intent":"general","listing_addresses":[],"photo_mode":false,"extractedData":{},"summary":{"client":"","interests":"","concerns":"","next_step":""},"priority":"warm","pending_checks":[],"thought_process":"..."}`;
}

// ─── Full-detail prompt (legacy analyzeConversation mode) ───────────────────

function buildFullDetailPrompt(context: ConversationContext): string {
  const { tenant, properties, conversationHistory } = context;
  const realtorName = context.realtorName || 'Agent';
  const realtorCompany = context.realtorCompany || '';
  const timezone = context.timezone || 'America/Los_Angeles';
  const viewingStart = context.viewingHoursStart || '10:00';
  const viewingEnd = context.viewingHoursEnd || '20:00';
  const fullProps = buildFullPropertiesText(properties);
  const historyText = buildHistoryText(conversationHistory);
  const preRanked = buildPreRankedSection(context);

  return `
CONTEXT:
REALTOR_NAME: ${realtorName}${realtorCompany ? ` (${realtorCompany})` : ''}
Client: ${tenant.name} (${tenant.email})
CURRENT DATE/TIME: ${buildDateContext()}
TIMEZONE: ${timezone}
VIEWING HOURS: ${viewingStart}–${viewingEnd} (${timezone})
${preRanked}Properties:
${fullProps}

HISTORY:
${historyText}

TASK:
1. Analyze the client's latest message.
2. Decide on the immediate NEXT ACTION.
3. If the client CONFIRMED a specific time for a viewing (e.g. "3pm works", "tomorrow at 4pm"), your action MUST be 'book_calendar'.
   - IMPORTANT: Use the CURRENT DATE/TIME above to resolve relative dates ("tomorrow", "next Monday", etc.) into precise ISO 8601 start_time values.
4. If you want to recommend properties, set action to 'send_listing'. Use ONLY the properties from PRE-RANKED MATCHES above (in the given order). NEVER recommend properties not in that list.
5. If escalation criteria are met (legal threats, discrimination complaints, emergencies, etc.), set action to 'escalate'.
6. Return ONLY valid JSON matching this structure.
   IMPORTANT: Output fields in THIS EXACT ORDER — critical fields first so partial responses are still useful:

{
  "action": "reply",
  "intent": "general",
  "escalation_reason": null,
  "listing_addresses": ["123 Main St", "456 Oak Ave"],
  "photo_mode": false,
  "action_params": { "start_time": "2026-02-01T15:00:00", "property_address": "", "client_name": "", "duration_minutes": 30 },
  "reply": "The actual message text to send to the client",
  "priority": "warm",
  "pending_checks": [],
  "suggestedProperties": ["123 Main St"],
  "propertyMatches": [
    { "address": "123 Main St", "score": 95, "reason": "Perfect budget fit and allows dogs" }
  ],
  "summary": {
    "client": "Jade Muray, 1 person, no pets, looking to rent a 2BR in Seattle for March 1st move-in, $2,500/mo budget.",
    "interests": "Interested in 19128 112th Ave NE ($2,350). Asked about gym.",
    "concerns": "None raised yet.",
    "next_step": "Schedule viewing for 19128 112th Ave NE."
  },
  "extractedData": {
    "personal": {
      "firstName": "John",
      "lastName": "Doe",
      "client_status": "qualifying",
      "email": "john@example.com",
      "phone": "+15551234567"
    },
    "timeline": {
      "move_in_date": "YYYY-MM-DD",
      "move_in_flexibility_days": 7,
      "lease_term_ideal_months": 12,
      "decision_timeline": "this_week",
      "decision_maker": "individual"
    },
    "budget": {
      "max_monthly_rent": 2500,
      "budget_stated": "2500 CAD",
      "budget_currency": "CAD",
      "budget_usd": 1800,
      "comfortable_monthly_rent": 2200,
      "utilities_preference": "all-in",
      "deposit_ready": true,
      "can_pay_first_last": false,
      "income_monthly": 8000,
      "income_source": "software engineer at Google",
      "employment_type": "w2",
      "credit_score_range": "good-700-749",
      "has_guarantor": false
    },
    "location": {
      "city": "Seattle",
      "state": "WA",
      "neighborhoods_must": ["Capitol Hill", "Downtown"],
      "neighborhoods_exclude": ["SODO"],
      "text_pref": "any area",
      "commute_destination": "Amazon HQ, Seattle",
      "commute_max_minutes": 30,
      "commute_mode": "public-transit"
    },
    "housing": {
      "property_types": ["rent"],
      "bedrooms_min": 2,
      "bathrooms_min": 1,
      "sqft_min": 700,
      "floor_preference": "upper",
      "furnished": "no",
      "no_carpet": true,
      "den_office": true
    },
    "occupants": {
      "total_count": 2,
      "adults": 2,
      "children": 0,
      "lifestyle": "quiet"
    },
    "pets": {
      "has_pets": true,
      "pet_type": ["dog"],
      "pet_breed": "Golden Retriever",
      "pet_weight_lbs": 65,
      "pet_count": 1
    },
    "amenities": {
      "parking": { "required": "required", "type_pref": ["garage"], "spots_needed": 1 },
      "laundry": { "required": "required", "must_be_in_unit": true },
      "ac_required": true,
      "desired_features": ["gym", "tv", "dishwasher", "balcony"],
      "deal_breakers": ["shared_laundry", "carpet", "no_parking"]
    }
  },
  "summary": {
  },
  "thought_process": "Detailed internal reasoning — output LAST so truncation only affects this field"
}

IMPORTANT: Evaluate ALL available properties listed above against the current client requirements (extractedData) and provide a match score (0-100) and a brief reason for each. A high score (80+) means it meets most mini-core requirements. Sort by score in your internal reasoning.

IMPORTANT: Only include extractedData fields that you actually found in THIS message or earlier in the conversation. Leave fields out if not mentioned. Do NOT include placeholder values or null fields.
`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Legacy analyzeConversation — full-detail mode.
 * Uses geminiJsonModel (with QUALIFICATION_SYSTEM_PROMPT as system instruction)
 * and sends full property details in the prompt.
 * Returns AiAnalysis (may include a `reply` field from the model).
 */
export async function analyzeConversation(context: ConversationContext): Promise<AiAnalysis> {
  console.log('🧠 AI Brain: Analyzing conversation...');
  const prompt = buildFullDetailPrompt(context);

  try {
    const result = await generateContentWithRetry(geminiJsonModel, prompt);
    const text = result.response.text();
    const analysis = repairTruncatedJson(text) as AiAnalysis;
    console.log('🧠 Analysis result:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ Phase 1 Analysis failed:', error);
    return {
      thought_process: "Error during analysis",
      intent: 'general',
      action: 'reply',
    } as any;
  }
}

/**
 * Lightweight analyzeBrain — minimal property data, no system prompt overhead.
 * Uses geminiFlashModel with 2-attempt retry + compact fallback.
 * Returns BrainResult (analysis only, no reply text).
 */
export async function analyzeBrain(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): Promise<BrainResult> {
  const parseBrainResponse = (text: string): BrainResult => {
    const parsed = repairTruncatedJson(text);
    const { reply: _discard, ...analysisFields } = parsed;
    return { analysis: analysisFields as AiAnalysis };
  };

  // Attempt 1
  try {
    const prompt = buildLightweightPrompt(context, executionResult);
    const result = await generateContentWithRetry(geminiFlashModel, prompt);
    const text = result.response.text();
    console.log(`🧠 analyzeBrain attempt 1: textLen=${text.length}, first 200:`, text.substring(0, 200));
    return parseBrainResponse(text);
  } catch (err1: any) {
    console.warn('⚠️ analyzeBrain attempt 1 failed:', err1?.message);
  }

  // Attempt 2 — shorter prompt with recent history only
  try {
    console.log('🔄 analyzeBrain: retrying with compact prompt...');
    const compactPrompt = buildCompactFallbackPrompt(context, executionResult);
    const result2 = await generateContentWithRetry(geminiFlashModel, compactPrompt);
    const text2 = result2.response.text();
    console.log('🧠 analyzeBrain attempt 2 (first 200):', text2.substring(0, 200));
    return parseBrainResponse(text2);
  } catch (err2: any) {
    console.error('❌ analyzeBrain both attempts failed:', err2?.message);
  }

  // Fallback — escalate
  return {
    analysis: {
      thought_process: 'AI brain processing error after 2 attempts — escalating',
      intent: 'general',
      action: 'escalate',
      escalation_reason: 'AI failed to analyze the message after multiple attempts',
    } as AiAnalysis,
  };
}
