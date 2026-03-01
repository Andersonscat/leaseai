import { SchemaType } from '@google/generative-ai';
import { geminiModel, generateContentWithRetry, genAI } from '@/lib/gemini-client';

// SMART AI QUALIFICATION SYSTEM persona
const QUALIFICATION_SYSTEM_PROMPT = `You are a professional real estate leasing agent. You are courteous, knowledgeable, and efficient. Your communication is warm but measured — never overly casual or salesy.

CORE PRINCIPLES:

1. PROFESSIONAL TONE
   - Write in a polished, conversational style — like a real estate professional texting a valued client.
   - Do NOT use excessive emojis, exclamation marks, or hype language.
   - One emoji per message is acceptable if it feels natural. Prefer none.
   - Keep responses concise: 3-5 sentences for standard replies.

2. LANGUAGE RULE
   Match the client's language exactly. Russian = Russian. English = English. Spanish = Spanish.

3. TWO-TIER DATA COLLECTION

   TIER 1 — MINI-CORE (actively ask, max ONE per message, only when missing):
   These items are MANDATORY. You MUST clarify all of them BEFORE suggesting a viewing or scheduling anything.
   1. **Name**: (Mandatory for dossier, but ask only at the end).
   2. **Lease Duration**: How long do they want to stay? (e.g. 12 months, short term).
   3. **Rent/Buy**: Confirm if they are looking to rent or purchase.
   4. **Move-in Date**: Exact date or month.
   5. **Budget**: Max monthly rent/price.
   6. **Occupants**: Total count of people.
   7. **Pets**: Yes/No + details.
   8. **Bedrooms**: Minimum required.

   RULES:
   - **HARD GATE — QUALIFICATION FIRST (NON-NEGOTIABLE)**:
     You MUST collect ALL 7 fields below before setting action to "send_listing" OR "book_calendar":
       ✅ Lease Duration  ✅ Rent/Buy  ✅ Move-in Date  ✅ Budget  ✅ Occupants  ✅ Pets  ✅ Bedrooms
     
     If ANY of these 7 fields are missing:
       → Your action MUST be "reply"
       → Ask for the ONE missing field you don't know yet
       → Do NOT mention any specific properties
       → Do NOT hint at matches or say "I have something for you"
   
   - Once ALL 7 are known: you may set action to "send_listing" and present matches.
   - NEVER ask more than ONE question per message.
   - If the client already provided a field, NEVER ask for it again.

   TIER 2 — PASSIVE EXTRACTION (NEVER ask, silently observe and extract):
   Everything else: lifestyle, WFH, children ages, lease term preference, floor preference,
   views, furnished preference, internet speed, allergies, red lines (no carpet, no highway),
   EV charging, storage, gym/pool preference, communication channel, viewing preferences.
   EXTRACT these from what the client volunteers. Do NOT ask about them directly.

   RULES:
   - NEVER ask more than ONE question per message.
   - If the client already provided a mini-core field, NEVER ask for it again.
   - Once mini-core is covered, STOP asking questions — focus on matching and booking.
   - Example: Client says "I need a 2-bed for me and my wife, budget around $2500, I work from home and have a cat" →
     Extract: bedrooms=2, occupants=2, budget_max=2500, wfh=true, has_pets=true, pet_type=cat.
     Do NOT ask "Do you have pets?" or "What is your budget?" — you already know.

4. ANTI-HALLUCINATION (STRICT)
   - ONLY discuss properties present in the PROPERTIES DATABASE section.
   - NEVER invent addresses, prices, availability, or features.
   - If no suitable properties exist, say so honestly and offer to notify them when matching listings appear.
   - If you are unsure about a detail, say: "Let me confirm that for you."

FAIR HOUSING AND COMPLIANCE (NON-NEGOTIABLE):
- NEVER ask about or consider protected characteristics (race, color, religion, national origin, sex, familial status, disability, age).
- If a client mentions discriminatory preferences, redirect to legal criteria.

SCHEDULING RULES:
- Viewing hours: 10:00 AM to 8:00 PM, every day (Pacific Time).
- If a client requests a time OUTSIDE these hours, politely suggest the nearest available slot within hours.
- **PRECISION CONFIRMATION**: When the client confirms or you suggest a specific slot, ALWAYS state the full day and date (e.g., "Monday, March 2nd at 2:00 PM") instead of just "next Monday". Use the 'Current Date' provided in context to calculate this correctly.
- Only book a viewing when the client CONFIRMS a specific date AND time.
- If they say vague things like "sometime next week", ask for a specific day and time.
- Default viewing duration: 30 minutes.

PROPERTY RECOMMENDATIONS:
- When recommending properties, present up to 3-5 matches with brief highlights for each.
- For each property, mention: address, price, bedrooms, and one unique selling point from the description.
- If you decide to recommend properties, set action to "send_listing" with property addresses in "listing_addresses", so a separate detailed listing email with photos is sent automatically.
- Always explain WHY each property is a good fit for this specific client.
- **BUDGET GAP RULE**: If you recommend a property that is over the client's stated budget, YOU MUST ACKNOWLEDGE IT. Say something like: "I know this is above your $2,000 target, but it checks all your other boxes..." Never ignore the price difference.

NEGOTIATION & OBJECTIONS:
- **Price Objections**: If a client says it's too expensive, justify the value using specific features (e.g., "It includes parking which saves you $200/mo" or "It has a gym/pool").
- **Constraint Conflicts**: If a client wants something impossible (e.g. low budget + high amenities), gently educate them on the market reality or offer the next best compromise.
- **No Repeats**: If you already recommended a property and the client asks about it again, acknowledge previous context ("As mentioned, that one is $2500..."). Do not introduce it as if it's new.

CRITICAL LOGIC RULES:
1. **DATES**: If a property's available_from date is in the PAST relative to 'Current Date', treat it as **AVAILABLE IMMEDIATELY**. Do not say "It is available starting [past date]". Say "It is available now".
2. **DESCRIPTIONS**: Trust the property description text as FACT. If it says "large yard", the property HAS a yard. Do not say "Let me check".
3. **BUDGET SAFETY**: If the client has NOT stated a budget, do NOT recommend properties over $3,000 unless they specifically ask for "luxury" or "penthouse". Instead, give a range or ask for their budget first.
4. **MATCH HONESTY RULES (CRITICAL)**:
   - A property can only be called an "excellent" or "perfect" match if ALL TIER 1 fields are known AND confirmed to match.
   - If Lease Duration is unknown: You MUST NOT use words like "perfectly", "excellent match", "ideal" or "aligns perfectly". Instead say "This looks like a **preliminary match** based on what we know so far."
   - **PROPERTY SCORES in extractedData**: If Lease Duration is still unknown, the max score for any property should be **70**. Do NOT score any property 80+ until ALL Tier 1 fields are confirmed.
   - Always state explicitly WHAT you are matching on (e.g., "This matches your $2,500 budget and 2-bedroom requirement") — never make blanket claims like "aligns with all your requirements" if there are still unknowns.

5. CLARIFICATION & ROBUSTNESS (GIBBERISH DETECTION)
   - **Ambiguous Input**: If a client's message is unclear, nonsensical, or looks like a keyboard layout error (e.g., Russian characters instead of English), DO NOT guess the meaning.
   - **Layout Errors**: Be alert for messages like "2 иувкщщщы" (which is "2 bedrooms" in Russian layout). If you suspect this, ask: "It looks like your message might have a keyboard layout error. Could you please clarify if you meant [your guess]?"
   - **No Blind Extraction**: NEVER record data into 'extractedData' unless you are 95% certain of its meaning. If you are unsure, leave the field null and ask for clarification.
   - **Gibberish**: If the message is complete nonsense (e.g., "asdfgh"), respond politely: "I'm sorry, I didn't quite catch that. Could you please rephrase your request?"

ESCALATION TO HUMAN (MANDATORY):
Set action to "escalate" when ANY of these occur:
- Client mentions legal action, lawsuits, or attorney involvement
- Client files a discrimination or Fair Housing complaint
- Client requests ADA/accessibility accommodations
- Client expresses repeated dissatisfaction (3+ negative messages in thread)
- Client asks for owner's personal information or contact
- Client reports a maintenance emergency (gas leak, flooding, fire, lockout)
- Client requests contract modifications or lease exceptions
- Client uses threatening or abusive language

SIGNATURE:
Sign your first reply and replies where the client introduced themselves with REALTOR_NAME (provided in context). Example: "Best regards, [Name]". Subsequent messages in the same thread do not need a signature unless the context changes.

=== CRITICAL GUARDRAILS === 
1. GROUNDING: You may ONLY discuss the exact addresses and attributes provided in the PROPERTIES DATABASE. 
2. UNKNOWN DATA: If the client has not stated a preference in the history, record it as NULL. Do not guess or assume.
3. INVENTING: UNDER NO CIRCUMSTANCES should you invent, assume, or hallucinate properties, addresses, prices, or amenities.
4. REFUSAL: If no properties match, you MUST say "I don't have exact matches" instead of inventing one.
5. MEETINGS: NEVER confirm or propose a meeting time that the client did not explicitly state or agree to.
===========================
`;

const geminiJsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  systemInstruction: QUALIFICATION_SYSTEM_PROMPT,
  generationConfig: { 
    temperature: 0.1, 
    topP: 0.4 
  }
});


export interface TenantData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  budget?: string;
  budget_min?: number;
  budget_max?: number;
  move_in_date?: string;
  requirements?: string; // bedrooms, pets, etc.
  bedrooms?: number;
  property_type?: string;
  preferred_neighborhoods?: string;
  has_pets?: boolean;
  occupants?: number;
  parking_needed?: boolean;
  lease_term_months?: number;
  qualification_status?: 'new' | 'qualifying' | 'qualified' | 'disqualified';
}

/**
 * NEW: High-fidelity Questionnaire Schema
 * Industry standard for modular CRM data collection.
 */
export interface TenantQuestionnaire {
  // Personal & Basics
  fullName?: { value: string; confidence: number };
  email?: { value: string; confidence: number };
  phone?: { value: string; confidence: number };
  
  // Financials
  budgetMax?: { value: number; confidence: number };
  budgetMin?: { value: number; confidence: number };
  incomeMonthly?: { value: number; confidence: number };
  creditScore?: { value: number; confidence: number };
  
  // Timing & Living
  moveInDate?: { value: string; confidence: number }; // YYYY-MM-DD
  leaseTermMonths?: { value: number; confidence: number };
  occupantsCount?: { value: number; confidence: number };
  
  // Preferences
  bedrooms?: { value: number; confidence: number };
  neighborhoods?: { value: string[]; confidence: number };
  petsDetails?: { value: string; confidence: number };
  hasPets?: { value: boolean; confidence: number };
  parkingNeeded?: { value: boolean; confidence: number };
  floorPreference?: { value: 'ground' | 'upper' | 'any'; confidence: number };
  
  // Meta
  conflicts?: string[]; // Log of conflicting information found
}

export interface Property {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  status: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  // New Zillow-aligned fields
  available_from?: string; // YYYY-MM-DD
  pet_policy?: string; // 'allowed', 'cats_only', 'small_dogs', 'no_pets'
  price_amount?: number; // Numeric price for easier comparison
  parking_type?: string; 
  parking_fee?: number;
  application_fee?: number;
  security_deposit?: number;
  utilities_included?: string[];
  utilities_fee?: number;
}

export interface ConversationContext {
  tenant: TenantData;
  properties: Property[];
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  lastAction?: string; 
  realtorName?: string;
  realtorPhone?: string;
}

// Function Calling Tool Definition
const bookCalendarTool = {
  functionDeclarations: [{
    name: "book_calendar_event",
    description: "Book a property viewing appointment on the calendar when the client explicitly confirms a specific date and time. Only call this when the client says something like '3pm works', 'yes that time is good', etc.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        start_time: {
          type: SchemaType.STRING,
          description: "ISO 8601 datetime string for viewing start in format YYYY-MM-DDTHH:mm:ss (e.g., '2026-01-28T15:00:00'). Use the timezone from conversation context or default to client's timezone (assumed local or PST if unsure)."
        },
        duration_minutes: {
          type: SchemaType.NUMBER,
          description: "Duration of the viewing in minutes. Default is 30 minutes for property viewings."
        },
        property_address: {
          type: SchemaType.STRING,
          description: "Full address of the property being viewed (e.g., '123 Main St, Seattle, WA')"
        },
        client_name: {
          type: SchemaType.STRING,
          description: "Client's full name for the calendar event"
        }
      },
      required: ["start_time", "property_address"]
    }
  }]
};

/**
 * Generate final AI response AFTER function execution
 * This is the second call - AI knows the actual result now!
 */
export async function generateResponseAfterFunction(context: {
  tenant: any;
  conversationHistory: any[];
  functionResult: {
    success: boolean;
    calendar_link?: string;
    event_time?: string;
    error?: string;
    property_address?: string;
  }
}): Promise<{ response: string }> {
  const prompt = `You called the book_calendar_event function and here's what happened:

${context.functionResult.success ? `✅ SUCCESS! Calendar event created.
📅 Event Link: ${context.functionResult.calendar_link}
⏰ Time: ${context.functionResult.event_time}
🏠 Address: ${context.functionResult.property_address || 'the property'}

 Now generate a friendly confirmation message to the client. 
 (CRITICAL: Just write the conversational message body. Do NOT try to format links or contact info yourself — another system will append the details automatically).$` : `❌ ERROR: ${context.functionResult.error}

The calendar booking failed. Generate a polite apology and ask the client to confirm the time again.`}

Generate ONLY the response text, no JSON, no extra formatting.`;

  const result = await generateContentWithRetry(geminiModel, prompt);
  const responseText = result.response.text();
  
  return { response: responseText };
}

// NEW: Strict Schemas for Analysis Phase
export interface AiAnalysis {
  thought_process: string;
  thoughts?: {
    analyze?: string;
    search?: string;
    reason?: string;
    draft?: string;
  };
  intent: 'booking_confirmed' | 'inquiry' | 'general';
  action: 'book_calendar' | 'reply' | 'send_listing' | 'escalate';
  action_params?: {
    start_time: string;
    property_address: string;
    client_name?: string;
    duration_minutes?: number;
  };
  extractedData?: Record<string, any>;
  summary?: string; // Concise bullet-point summary for the UI
  priority?: 'hot' | 'warm' | 'cold';
  suggestedProperties?: string[];
  listing_addresses?: string[]; 
  propertyMatches?: {
    address: string;
    score: number; // 0-100
    reason: string; // Brief one-line explanation
  }[];
}

export interface VerificationResult {
  hasHallucinations: boolean;
  hallucinatedAddresses: string[];
  reason?: string;
}

/**
 * PHASE 1: THE BRAIN
 * Analyze the conversation and decide on an ACTION.
 * Output is STRICT JSON. No text generation yet.
 */
export async function analyzeConversation(context: ConversationContext): Promise<AiAnalysis> {
  console.log('🧠 AI Brain: Analyzing conversation...');
  const { tenant, properties, conversationHistory } = context;

  const realtorName = context.realtorName || 'Agent';

  const propertiesText = properties.map(p => 
    `- ${p.address}:
       Price: ${p.price}
       Beds: ${p.bedrooms}
       Status: ${p.status}
       Description: ${p.description || 'N/A'}
       Available: ${p.available_from || 'Now'}
       Pets: ${p.pet_policy || 'Unknown'}
       Parking: ${p.parking_type || 'Unknown'} (${p.parking_fee ? '$'+p.parking_fee : 'included'})
       Utilities: ${p.utilities_included?.join(', ') || 'Tenant pays'}
       Fees: App $${p.application_fee || '0'}, Deposit $${p.security_deposit || '0'}
       Photos: ${p.images?.length ? p.images.length + ' available' : 'None'}`
  ).join('\n\n');

  const historyText = conversationHistory.map(m => 
    `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`
  ).join('\n');

  // Dynamic date context so AI can resolve "tomorrow", "next Monday", etc.
  const now = new Date();
  const currentDateContext = `${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;

  const analysisPrompt = `
CONTEXT:
REALTOR_NAME: ${realtorName}
Client: ${tenant.name} (${tenant.email})
CURRENT DATE/TIME: ${currentDateContext}
TIMEZONE: America/Los_Angeles (Pacific Time)
Properties:
${propertiesText}

HISTORY:
${historyText}

TASK:
1. Analyze the client's latest message.
2. Decide on the immediate NEXT ACTION.
3. If the client CONFIRMED a specific time for a viewing (e.g. "3pm works", "tomorrow at 4pm"), your action MUST be 'book_calendar'.
   - IMPORTANT: Use the CURRENT DATE/TIME above to resolve relative dates ("tomorrow", "next Monday", etc.) into precise ISO 8601 start_time values.
4. If you want to recommend properties, set action to 'send_listing' and include 'listing_addresses' with property addresses. ONLY suggest properties from the PROPERTIES database provided. NEVER invent an address. If no properties are listed, or none match, do NOT invent them.
5. If escalation criteria are met (legal threats, discrimination complaints, emergencies, etc.), set action to 'escalate'.
6. Return ONLY valid JSON matching this structure:

{
  "thought_process": "Detailed internal reasoning",
  "intent": "general",
  "action": "reply",
  "action_params": { "start_time": "2026-02-01T15:00:00", "property_address": "", "client_name": "", "duration_minutes": 30 },
  "listing_addresses": ["123 Main St", "456 Oak Ave"],
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
      "lease_term_ideal_months": 12, // MANDATORY: clarify if unknown
      "decision_timeline": "this_week",
      "decision_maker": "individual"
    },
    "budget": {
      "max_monthly_rent": 2500,
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
      "neighborhoods_must": ["Capitol Hill", "Downtown"],
      "neighborhoods_exclude": ["SODO"],
      "text_pref": "any area",
      "commute_destination": "Amazon HQ, Seattle",
      "commute_max_minutes": 30,
      "commute_mode": "public-transit"
    },
    "housing": {
      "property_types": ["rent", "apartment"], // MANDATORY: clarify 'rent' or 'buy'
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
      "required_amenities": ["gym", "coworking area"], // Mapped to DB column
      "utilities_included_preference": ["internet"]   // Mapped to DB column
    },
    "red_lines": {
      "no_near_highway": true,
      "other_hard_noes": ["shared laundry", "carpet"]
    }
  },
  "summary": "Brief text summary",
  "priority": "warm",
  "suggestedProperties": ["123 Main St"],
  "propertyMatches": [
    { "address": "123 Main St", "score": 95, "reason": "Perfect budget fit and allows dogs" },
    { "address": "456 Oak Ave", "score": 40, "reason": "Over budget and no pets allowed" }
  ]
}

IMPORTANT: Evaluate ALL available properties listed above against the current client requirements (extractedData) and provide a match score (0-100) and a brief reason for each. A high score (80+) means it meets most mini-core requirements. Sort by score in your internal reasoning.

IMPORTANT: Only include extractedData fields that you actually found in THIS message or earlier in the conversation. Leave fields out if not mentioned. Do NOT include placeholder values or null fields.
`;

  try {
    const result = await generateContentWithRetry(geminiJsonModel, analysisPrompt);
    const text = result.response.text();
    
    // Robust JSON parsing
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    
    const analysis = JSON.parse(cleanText) as AiAnalysis;
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
 * PHASE 0: THE OBSERVER (Extraction 2.0)
 * Extracts structured data from conversation history.
 * Handles Conflict Resolution and Confidence Scoring.
 */
export async function extractLeadData(
  history: { role: 'user' | 'assistant'; content: string }[],
  currentData: Partial<TenantData>
): Promise<TenantQuestionnaire> {
  console.log('🔍 AI Observer: Extracting lead details...');
  
  const historyText = history.map(m => `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`).join('\n');
  
  const prompt = `
    You are a Data Extraction Specialist. Your goal is to fill out a Rental Application Questionnaire based on a conversation history.
    
    CURRENT DATA (FACTS):
    ${JSON.stringify(currentData, null, 2)}
    
    CONVERSATION HISTORY:
    ${historyText}
    
    TASK:
    1. Extract all possible details for the questionnaire.
    2. Assign a "confidence" score (0.0 to 1.0) for each field. Low if vague, high if explicit.
    3. CONFLICT RESOLUTION: If the client explicitly changes a previously stated value (e.g. from 1-bed to 2-bed), use the NEW value and log the conflict in the "conflicts" array.
    4. Format dates as YYYY-MM-DD.
    5. Mask any extremely sensitive PII (like Social Security Numbers if mentioned, though unlikely) with [REDACTED].
    6. DO NOT GUESS OR INVENT DATA. If a field (like budget, pets, move-in date) is not EXPLICITLY stated in the CONVERSATION HISTORY, you MUST leave the field empty/null.
    
    RETURN ONLY VALID JSON:
    {
      "fullName": { "value": "John Doe", "confidence": 0.9 },
      "email": { "value": "...", "confidence": 0.9 },
      "phone": { "value": "...", "confidence": 0.9 },
      "budgetMax": { "value": 2500, "confidence": 0.95 },
      "moveInDate": { "value": "2026-03-01", "confidence": 0.8 },
      "bedrooms": { "value": 2, "confidence": 0.9 },
      "hasPets": { "value": true, "confidence": 1.0 },
      "petsDetails": { "value": "Small Golden Retriever", "confidence": 0.9 },
      "occupantsCount": { "value": 2, "confidence": 0.7 },
      "conflicts": ["Client initially said $2000 budget, but now says $2500 is okay."]
    }
  `;

  try {
    const result = await generateContentWithRetry(geminiJsonModel, prompt);
    let text = result.response.text();
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    
    return JSON.parse(cleanText) as TenantQuestionnaire;
  } catch (err) {
    console.error('❌ Extraction failed:', err);
    return { conflicts: [] };
  }
}

/**
 * PII MASKING UTILITY
 * Masks sensitive information for logging or external agents.
 */
export function maskPII(text: string): string {
  // Basic regex for email and phone masking
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]')
    .replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE-REDACTED]');
}

/**
 * PHASE 3: THE VOICE (Phase 2 is execution in sync-service)
 * Generate the final email text based on what happened.
 */
export async function generateFinalResponse(
  context: ConversationContext, 
  analysis: AiAnalysis,
  executionResult?: { success: boolean; data?: any; error?: string }
): Promise<string> {
  console.log('🗣️ AI Voice: Generating response...');
  
  let instructions = '';
  
  if (analysis.action === 'book_calendar') {
    if (executionResult?.success) {
      instructions = `
      ACTION RESULT: Calendar event created successfully!
      Link: ${executionResult.data.htmlLink}
      Time: ${executionResult.data.start.dateTime}
      
      TASK: Write a professional confirmation. INCLUDE THE LINK.
      `;
    } else {
      instructions = `
      ACTION RESULT: Booking failed.
      Error: ${executionResult?.error}
      
      TASK: Apologize politely and ask to try a different time.
      `;
    }
  } else if (analysis.action === 'send_listing') {
    instructions = `
    TASK: Present the recommended properties directly in your message. Give a brief summary (address, price, beds, and why it fits) for each. Mention that you are ALSO sending a detailed listing with photos in a follow-up email.
    Properties to present: ${analysis.listing_addresses?.join(', ') || analysis.suggestedProperties?.join(', ') || 'matching properties'}
    Focus on: ${analysis.thought_process}
    `;
  } else if (analysis.action === 'escalate') {
    instructions = `
    TASK: The situation requires human attention. Write a professional message letting the client know you are connecting them with a team member who can better assist. Do NOT attempt to resolve the issue yourself.
    Reason for escalation: ${analysis.thought_process}
    `;
  } else {
    instructions = `
    TASK: Write a helpful response based on your analysis.
    Focus on: ${analysis.thought_process}
    `;
  }
 
  const realtorName = context.realtorName || 'Agent';
  const realtorPhone = context.realtorPhone || 'Contact office for details';

  const propertiesText = context.properties.map(p => 
    `- ${p.address}: ${p.price}, ${p.bedrooms} beds. Available: ${p.available_from || 'Now'}`
  ).join('\n');

  const historyText = context.conversationHistory.map(m => 
    `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`
  ).join('\n');

  const prompt = `
${QUALIFICATION_SYSTEM_PROMPT}

STRICT ANTI-HALLUCINATION RULES (CRITICAL ARBITER):
1. ONLY discuss properties listed in the "PROPERTIES DATABASE" section below.
2. If no properties are provided or none match, DO NOT invent names, addresses, or features. 
3. If you need to mention a property, use its REAL address and features.
4. If you don't have suitable properties, say so honestly — do NOT make up hypothetical listings.
5. CRITICAL: You are strictly forbidden from mentioning any property address, price, or feature that is not in the PROPERTIES DATABASE. Do not invent links, phone numbers, or names.

PROPERTIES DATABASE:
${propertiesText || 'No properties available at the moment.'}

CONVERSATION CONTEXT:
REALTOR_NAME: ${realtorName}
Client: ${context.tenant.name}
History:
${historyText}

INSTRUCTIONS:
${instructions}

 
 Style: Professional, concise, and helpful. 
 (CRITICAL: Just write the conversational message body. Do NOT try to format links or contact info yourself — another system will append the details automatically).

Generate ONLY the message body text. No JSON, no extra formatting.
`;

  try {
    const result = await generateContentWithRetry(geminiModel, prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Phase 2 Generation failed:', error);
    return `Hi ${context.tenant.name}! Thanks for your message. I'm looking into the best options for you and will get back to you shortly!`;
  }
}

/**
 * PHASE 4: THE JUDGE
 * Verify if the generated response contains ANY property addresses or details 
 * that are NOT in our provided properties list.
 */
export async function verifyResponseHallucinations(
  responseText: string,
  properties: Property[]
): Promise<VerificationResult> {
  console.log('⚖️ AI Judge: Verifying hallucinations...');
  
  const knownAddresses = properties.map(p => p.address);
  
  const verificationPrompt = `
    You are a strict Auditor. Your task is to check a "Generated Message" for property address hallucinations.
    
    KNOWN PROPERTIES (FACTS):
    ${knownAddresses.map(addr => `- ${addr}`).join('\n')}
    ${knownAddresses.length === 0 ? 'No properties available.' : ''}
    
    GENERATED MESSAGE:
    "${responseText}"
    
    TASK:
    1. Identify all physical addresses, building names, or specific property locations mentioned in the message.
    2. Compare them against the KNOWN PROPERTIES list.
    3. If an address is mentioned that is NOT in the KNOWN list, it is a HALLUCINATION.
    
    RETURN ONLY VALID JSON:
    {
      "hasHallucinations": boolean,
      "hallucinatedAddresses": ["address1", "address2"],
      "reason": "Brief explanation of what was hallucinated"
    }
  `;

  try {
    const result = await generateContentWithRetry(geminiModel, verificationPrompt);
    let text = result.response.text();
    
    // Parse JSON safely
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    
    const verification = JSON.parse(cleanText) as VerificationResult;
    return verification;
  } catch (err) {
    console.error('❌ Verification failed, assuming safe:', err);
    return { hasHallucinations: false, hallucinatedAddresses: [] };
  }
}

/**
 * Calculate lead score based on tenant data
 * Simple scoring system (0-10)
 */
export function calculateLeadScore(tenant: Partial<TenantData>): number {
  let score = 0;
  
  // Basic contact info
  if (tenant.email) score += 1;
  if (tenant.phone) score += 2; // Phone is valuable
  if (tenant.name) score += 1;
  
  // Qualification details
  if (tenant.budget) score += 2;
  if (tenant.move_in_date) score += 2;
  if (tenant.requirements) score += 1;
  
  // Cap at 10
  return Math.min(score, 10);
}

/**
 * Get lead quality label from score
 */
export function getLeadQuality(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 7) return 'hot';
  if (score >= 4) return 'warm';
  return 'cold';
}

/**
 * Simple property matching logic
 * Matches based on price (budget) and bedrooms
 */
export function matchProperties(tenant: Partial<TenantData>, properties: Property[]): Property[] {
  if (!properties || properties.length === 0) return [];
  
  // If no requirements, return random top 3
  if (!tenant.budget && !tenant.requirements) {
    return properties.slice(0, 3);
  }
  
  return properties.filter(p => {
    // 1. Budget check
    if (tenant.budget) {
      // Prefer price_amount if available, else parse string
      const priceNum = p.price_amount ?? parseInt(p.price.replace(/[^0-9]/g, ''));
      const budgetNum = parseInt(tenant.budget.replace(/[^0-9]/g, ''));
      
      if (!isNaN(budgetNum) && !isNaN(priceNum)) {
        // Allow properties up to 10% over budget
        if (priceNum > budgetNum * 1.1) return false;
      }
    }

    // 2. Availability Date Check (New Zillow Data)
    if (tenant.move_in_date && p.available_from) {
      const moveIn = new Date(tenant.move_in_date);
      const available = new Date(p.available_from);
      
      // If property available AFTER move-in date, it's a mismatch
      // (Allow 7 day buffer for flexibility)
      const buffer = 7 * 24 * 60 * 60 * 1000;
      if (available.getTime() > moveIn.getTime() + buffer) {
        return false;
      }
    }
    
    // 3. Pet Policy Check
    if (tenant.has_pets && p.pet_policy === 'no_pets') {
      return false;
    }
    
    // 4. Bedroom check
    if (tenant.requirements) {
      const reqLower = tenant.requirements.toLowerCase();
      if (reqLower.includes('studio') && p.bedrooms !== 0) return false;
      if (reqLower.includes('1 bed') && p.bedrooms < 1) return false;
      if (reqLower.includes('2 bed') && p.bedrooms < 2) return false;
    }
    
    return true;
  }).slice(0, 5); // Return top 5 matches
}

/**
 * Programmatically format booking details to ensure perfect Markdown/HTML output
 */
export function formatBookingDetails(params: {
  address: string;
  calendarLink: string;
  eventTime: string;
  realtorName: string;
  realtorPhone: string;
}): string {
  const encodedAddress = encodeURIComponent(params.address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  let displayTime = params.eventTime;
  try {
    const date = new Date(params.eventTime);
    if (!isNaN(date.getTime())) {
      displayTime = date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (e) {}

  return `
---
**Booking Details:**

*   **Property:** [${params.address}](${mapsUrl})
*   **Time:** [${displayTime}](${params.calendarLink})
*   **Agent:** ${params.realtorName} (${params.realtorPhone})
`.trim();
}
