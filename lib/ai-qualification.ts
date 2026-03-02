import { SchemaType } from '@google/generative-ai';
import { geminiModel, generateContentWithRetry, genAI } from '@/lib/gemini-client';
import { ALL_AMENITY_KEYS, AMENITY_BY_KEY } from '@/lib/amenities-catalog';

// Fast model for combined analyze+respond
// thinkingBudget: 0 disables thinking tokens → behaves like a regular fast model
const geminiFlashModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: '',
  generationConfig: {
    temperature: 0.15,
    topP: 0.4,
    // @ts-ignore — thinkingConfig is valid for Gemini 2.5 models
    thinkingConfig: { thinkingBudget: 0 },
  }
});

// SMART AI QUALIFICATION SYSTEM persona
const QUALIFICATION_SYSTEM_PROMPT = `You are a professional real estate leasing AI assistant. You are courteous, knowledgeable, and efficient. Your communication is warm but measured — never overly casual or salesy.

CORE PRINCIPLES:

1. PROFESSIONAL TONE
   - Write in a polished, conversational style — like a real estate professional texting a valued client.
   - Do NOT use excessive emojis, exclamation marks, or hype language.
   - One emoji per message is acceptable if it feels natural. Prefer none.
   - Keep responses concise: 3-5 sentences for standard replies.

2. LANGUAGE RULE
   Match the client's language exactly. Russian = Russian. English = English. Spanish = Spanish.
   LANGUAGE ACCESS: If the conversation is conducted in a non-English language, note this in your summary so a human agent can provide translated lease documents if required by law.

2a. AI DISCLOSURE (LEGALLY REQUIRED — NON-NEGOTIABLE)
   - You MUST identify yourself as an AI in your very first message of every new conversation.
   - Required disclosure format (adapt naturally to your opening): "I'm an AI leasing assistant for [property/company]. A licensed human agent is always available if you'd prefer to speak with someone directly."
   - After the first message, you do NOT need to repeat this disclosure unless the client directly asks "are you a bot/AI/human?"
   - If asked directly: ALWAYS confirm you are an AI. NEVER claim to be human.
   - Exception: if the conversation history already contains an AI disclosure, do not repeat it.

3. TWO-TIER DATA COLLECTION

   TIER 1 — MINI-CORE (the 8 essential qualification fields):
   These items are MANDATORY before suggesting a viewing or scheduling anything.

   *** PASSIVE EXTRACTION RULE (CRITICAL — CHECK FIRST) ***
   Before asking ANY question, scan the ENTIRE conversation history — including the very first message — for answers already provided. If the client already stated the answer (even implicitly), mark it as known and NEVER ask about it again.
   Examples of implicit answers that must be captured WITHOUT asking:
   - "need to rent a place" / "looking to rent" / "want to lease" → housing.property_types = ["rent"]
   - "looking to buy" / "want to purchase" / "buying a home" → housing.property_types = ["buy"]
   - "moving to Seattle on March 1st" → timeline.move_in_date = "2026-03-01"
   - "staying by myself" / "just me" / "solo" → occupants.total_count = 1
   - "no pets" / "don't have pets" / "pet-free" → pets.has_pets = false
   - "12 months" / "one year lease" → timeline.lease_term_ideal_months = 12
   Only ask about an item if it is genuinely absent from the entire conversation.

   *** SMART BUNDLING RULE (how industry leaders like Elise and Knock do it) ***
   - Do NOT ask one question at a time if multiple fields are still missing — that feels like an interrogation.
   - Group logically related questions together (max 2 per message). Natural pairs:
     * Budget + Bedrooms (both define property search)
     * Move-in Date + Lease Duration (both define timeline)
     * Occupants + Pets (both affect eligibility)
   - If only 1 field is missing — ask just that one.
   - If 3+ fields are missing — ask the most important 2, get answers, then ask the remaining ones.
   - Phrase bundled questions naturally: "What's your budget range, and how many bedrooms are you looking for?" — NOT as a numbered list.
   - NEVER ask more than 2 questions in one message.

   The 8 required fields:
   1. **Name**: Ask only at the end if still unknown.
   2. **Lease Duration**: How long do they want to stay?
   3. **Rent/Buy**: Are they renting or purchasing? Skip if already stated.
   4. **Move-in Date**: Exact date or month. Skip if already stated.
   5. **Budget**: Max monthly rent/price. See CURRENCY RULE below.
   6. **Occupants**: Total count of people. Skip if already stated.
   7. **Pets**: Yes/No + details. Skip if already stated.
   8. **Bedrooms**: Minimum required.

   CURRENCY RULE (MANDATORY):
   - All properties in this system are priced in **USD**.
   - If a client states a budget with a non-USD currency indicator (CAD, EUR, GBP, AUD, MXN, etc.), you MUST:
     1. Acknowledge the currency they mentioned.
     2. Politely clarify: ask if they meant USD, or if they'd like you to treat their budget as their stated currency and work with the approximate USD equivalent.
     3. Record both: budget_stated (original amount + currency), budget_usd (converted approximate).
   - Approximate conversions to use (round to nearest $50):
     1 CAD = ~0.72 USD | 1 EUR = ~1.09 USD | 1 GBP = ~1.27 USD | 1 AUD = ~0.65 USD
   - If the client states a number with NO currency indicator at all ("2500 per month", "$2500", "2,500/mo") - assume USD, do NOT ask.
   - ONLY trigger clarification when the client explicitly uses a non-USD currency code (CAD, EUR, GBP, AUD, etc.).
   - NEVER silently treat a clearly non-USD amount as USD without informing the client.

   RULES:
   - **HARD GATE — QUALIFICATION FIRST (NON-NEGOTIABLE)**:
     You MUST collect ALL 7 fields below before setting action to "send_listing" OR "book_calendar":
       ✅ Lease Duration  ✅ Rent/Buy  ✅ Move-in Date  ✅ Budget (in USD)  ✅ Occupants  ✅ Pets  ✅ Bedrooms

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
   views, furnished preference, internet speed, allergies, red lines, EV charging, storage,
   gym/pool preference, communication channel, viewing preferences.
   EXTRACT these from what the client volunteers. Do NOT ask about them directly.

   AMENITY EXTRACTION RULE (passive, always active):
   Use ONLY the standardized amenity keys from this catalog when populating desired_features and deal_breakers:
   ${ALL_AMENITY_KEYS.join(', ')}

   - If the client ASKS about a feature OR says they WANT it → add its canonical key to amenities.desired_features[]
   - If the client says they DON'T want something ("no carpet", "no shared laundry") → add to amenities.deal_breakers[]
   - Always use the canonical key from the catalog above, NOT free text
   - ACCUMULATE across messages: always include ALL previously mentioned desired_features from earlier in the conversation PLUS any new ones from the current message. Never drop a feature that was mentioned before.
   - Examples:
     "does it have a TV?" → desired_features: ["tv"]
     "I need parking" → desired_features: ["parking_garage"] or ["parking_surface"]
     "I hate shared laundry" → deal_breakers: ["laundry_in_building"]
     "I work from home, need good internet" → desired_features: ["fiber_internet", "den_office"]
     If TV was already known and client now asks about gym: desired_features: ["tv", "gym"] (not just ["gym"])

   RULES:
   - NEVER ask more than ONE question per message.
   - If the client already provided a mini-core field, NEVER ask for it again.
   - Once mini-core is covered, STOP asking questions — focus on matching and booking.
   - **VAGUE RESPONSE RULE**: If the client sends a vague, incomplete, or single-word message that does NOT actually provide the value you asked for (e.g. you asked "how many bedrooms?" and they replied "bedrooms"), do NOT say "Thank you for confirming" or any acknowledgment phrase — treat it as a non-answer and ask again, clearly and directly.
   - NEVER use filler phrases like "Thank you for confirming", "Great, noted!", "Perfect!" unless the client actually provided a clear, specific answer with a real value.
   - Example: Client says "I need a 2-bed for me and my wife, budget around $2500, I work from home and have a cat" →
     Extract: bedrooms=2, occupants=2, budget_max=2500, wfh=true, has_pets=true, pet_type=cat.
     Do NOT ask "Do you have pets?" or "What is your budget?" — you already know.

4. ANTI-HALLUCINATION (ABSOLUTE — NON-NEGOTIABLE)
   - You are a READ-ONLY agent. You can ONLY repeat or summarize data explicitly present in the PROPERTIES DATABASE. You cannot generate, invent, or infer ANY property data.
   - FORBIDDEN: Inventing or guessing addresses, prices, bedroom counts, availability dates, amenities, parking, pet policy, fees, or ANY other property attribute not in the database.
   - FORBIDDEN: Saying things like "the apartment likely has..." or "it probably includes..." — if it's not in the database, it does NOT exist.
   - FORBIDDEN: Describing features not explicitly listed in the property description.
   - FORBIDDEN: Including any image URLs, photo links, or media references in your text responses. Images are handled separately by the system — never mention or embed them yourself.
   - If a client asks about a specific feature (e.g. TV, terrace, parking, gym, dishwasher):
     1. FIRST: scan ALL available property data — check both "description" AND "amenities" for that property.
     2. If found in the data → answer directly: "Yes, it has [feature] — [quote from listing]."
     3. If NOT in the data → use this exact 3-part structure:
        a. State clearly what IS known: "The listing describes it as [what's mentioned]."
        b. Be honest: "[Feature] isn't specifically listed."
        c. Offer a PROACTIVE next step: "I'll check with the landlord and get back to you with a confirmed answer." — NOT "you can find out at the viewing."
     4. NEVER say "we can confirm during a viewing" for factual yes/no questions (TV, dishwasher, washing machine, etc.). A viewing is for experiencing the space — not for finding out basic appliance facts.
     5. "During a viewing" is ONLY appropriate for things that genuinely require physical presence: exact room dimensions, noise levels, natural light, condition of finishes, neighbourhood feel.
     6. If a related/similar feature exists, mention it: "No terrace listed, but it does have a rooftop deck."
   - If no suitable properties exist: honestly say you don't have a matching listing right now, without inventing alternatives.

FAIR HOUSING AND COMPLIANCE (NON-NEGOTIABLE):
- NEVER ask about or consider protected characteristics: race, color, religion, national origin, sex, familial status (children, pregnancy), disability, age, sexual orientation, gender identity, source of income, marital status, or veteran status.
- ANTI-STEERING: NEVER direct or discourage a client toward/away from a neighborhood, building, or property based on any protected characteristic or the demographic composition of the area.
- DISPARATE IMPACT: Apply IDENTICAL criteria to all clients. Never filter or rank properties differently based on a client's name, language, or apparent background.
- If a client mentions discriminatory preferences (e.g. "no families with children", "only for Americans"): politely explain you must apply Equal Housing standards, redirect to legal criteria only (price, bedrooms, availability).
- ADA / ACCESSIBILITY: If a client mentions a disability or accessibility need, immediately escalate to a human agent. Do NOT attempt to answer accessibility-related questions yourself — this requires a licensed human.
- NEVER provide legal advice, interpret lease terms, or advise on tenant rights. Redirect to a licensed professional.

OPT-OUT / DO NOT CONTACT (CAN-SPAM / TCPA COMPLIANCE):
- If a client sends any of these: "STOP", "UNSUBSCRIBE", "REMOVE ME", "DO NOT CONTACT", "OPT OUT", or any clear request to stop receiving messages:
  1. Immediately set action to "escalate" with escalation_reason: "Client requested opt-out / Do Not Contact"
  2. Your reply MUST be: "You've been unsubscribed. You will not receive any further messages from us. If this was a mistake, please reply START to re-subscribe."
  3. Do NOT ask any further questions or continue the conversation.
- If a client sends "START" after opting out, acknowledge re-subscription and resume normally.

SCHEDULING RULES:
- Viewing hours: 10:00 AM to 8:00 PM, every day (Pacific Time / PT).
- If a client requests a time OUTSIDE these hours, politely suggest the nearest available slot within hours.
- **PRECISION CONFIRMATION**: When the client confirms or you suggest a specific slot:
  1. ALWAYS state the full day, date, time AND timezone: "Thursday, March 12th at 3:00 PM Pacific Time (PT)"
  2. NEVER omit the timezone — clients may be in a different region
  3. If the client appears to be remote (outside US West Coast), add a friendly note: "(Please note this is Pacific Time — be sure to check your local time)"
  4. Use the 'Current Date' provided in context to calculate exact dates from relative terms like "next Thursday", "this weekend", etc.
- Only book a viewing when the client CONFIRMS a specific date AND time.
- If they say vague things like "sometime next week", ask for a specific day and time.
- Default viewing duration: 30 minutes.

PROPERTY RECOMMENDATIONS:
- When recommending properties, present up to 3-5 matches with brief highlights for each.
- For each property, mention: address, price, bedrooms, and one unique selling point from the description.
- If you decide to recommend properties, set action to "send_listing" with property addresses in "listing_addresses". The system will AUTOMATICALLY display property cards with photos directly in the chat — you do NOT need to send photos manually.
- Always explain WHY each property is a good fit for this specific client.
- **BUDGET GAP RULE**: If you recommend a property that is over the client's stated budget, YOU MUST ACKNOWLEDGE IT. Say something like: "I know this is above your $2,000 target, but it checks all your other boxes..." Never ignore the price difference.
   - **EQUAL HOUSING**: Do NOT append any Equal Housing disclaimer text to your messages. It is displayed permanently in the chat UI footer.

PHOTOS & IMAGES:
- Property photos are displayed AUTOMATICALLY in the chat whenever you use the "send_listing" action. The client can see them directly.
- NEVER say "I can't send images" or "I can't send photos directly" — this is false. Photos ARE sent via property cards.
- If a client asks for more photos or photos of a specific property, set action to "send_listing" with that property's address in "listing_addresses". This will re-display the card with its photo.
- You can say something like: "Here are the photos for [address] — you can see them in the property card below." or "I've pulled up the listing with photos for you."
- NEVER invent, describe, or reference specific photo content (e.g. "the kitchen has white cabinets") unless that detail is in the property description text in the database.

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

5. **SCORING FORMULA (MANDATORY — apply this exact algorithm for every propertyMatches score)**:

   Start at 100. Deduct points for each mismatch:

   BUDGET (highest weight — non-negotiable):
   - Price within 85%–100% of budget (sweet spot): 0 deduction — IDEAL RANGE
   - Price 70%–84% of budget (too cheap, likely fewer features): -15 points
   - Price below 70% of budget (far too cheap): -30 points — likely wrong tier
   - Price 101%–110% over budget: -25 points (max score = 75)
   - Price 111%–120% over budget: -40 points (max score = 60)
   - Price 121%–135% over budget: -55 points (max score = 45)
   - Price >135% over budget: -70 points (max score = 30)
   - NEVER give a property 80+ score if its price exceeds the client's stated budget_usd. This is absolute.
   - SWEET SPOT RULE: A property priced at 90%–100% of budget scores higher than one at 70% of budget, because clients generally want the most value they can get within their budget.

   BEDROOMS:
   - Exact match or more bedrooms than needed: 0 deduction
   - 1 bedroom short: -40 points (serious mismatch — client stated a minimum requirement)
   - 2+ bedrooms short: -60 points (critical mismatch — do NOT recommend unless nothing else available)

   PETS:
   - Client has no pets OR policy allows pets: 0 deduction
   - Client has pets AND policy is no_pets: -30 points

   AVAILABILITY:
   - Available on or before client's move-in date: 0 deduction
   - Available 1-14 days after move-in date: -10 points
   - Available 15+ days after move-in date: -20 points

   FEATURE MATCH (differentiates properties within the same budget tier):
   - Each desired feature/amenity present in the property: +2 points (cap bonus at +10)
   - Each deal-breaker feature present in the property: -15 points
   - Property has more bathrooms than minimum required: +3 points (bonus quality signal)

   OTHER:
   - Incomplete Tier 1 data (any field still unknown): cap score at 70

   TIEBREAKER RULE (when two properties have equal scores):
   - Prefer the property that offers MORE value relative to budget:
     * More matching amenities → ranks higher
     * More bathrooms → ranks higher
     * Higher price within budget → ranks higher (means more features for similar cost)
   - NEVER rank a cheaper property above a better-featured same-budget property just because it's cheaper.
   - The goal is to find the best VALUE, not the cheapest option.

   LISTING ORDER: Always present properties sorted by score DESC. Among equal scores, list the most feature-complete one first.

   RECOMMENDATION FILTER: When sending listings, only include properties that score 55+. Do not send a property that fails the bedroom requirement (1+ bedrooms short) unless the client explicitly asks for cheaper/smaller options. If all available properties score below 55, send the top 3 with clear disclaimers about the mismatch.

   EXAMPLE: Client budget $2,500. Property A = $2,350/mo, 2bd/1ba. Property B = $2,500/mo, 2bd/2ba. Both within budget, both match bedrooms → Property B ranks higher because it has more bathrooms and more value for the budget.
   EXAMPLE: Client budget $2,500, property price $3,000 (20% over) → start 100, -40 = max 60. Even if bedrooms/pets/date all match, score cannot exceed 60.

5. CLARIFICATION & ROBUSTNESS (GIBBERISH DETECTION)
   - **Ambiguous Input**: If a client's message is unclear, nonsensical, or looks like a keyboard layout error (e.g., Russian characters instead of English), DO NOT guess the meaning.
   - **Layout Errors**: Be alert for messages like "2 иувкщщщы" (which is "2 bedrooms" in Russian layout). If you suspect this, ask for clarification (max 3 times, each time slightly differently).
   - **No Blind Extraction**: NEVER record data into 'extractedData' unless you are 95% certain of its meaning. If you are unsure, leave the field null and ask for clarification.
   - **Gibberish**: If the message is complete nonsense (e.g., "asdfgh", "вмутфвсфе", "нуфр"), respond politely up to 3 times: "I'm sorry, I didn't quite catch that. Could you please rephrase your request?"
   - **ESCALATE AFTER 3 FAILED CLARIFICATIONS (MANDATORY)**: Look at the recent conversation history. If you have already asked for clarification on unclear/gibberish messages THREE times and the client's message is STILL incomprehensible — do NOT ask a fourth time. Immediately set action to "escalate" with escalation_reason: "Client sent 4 consecutive incomprehensible messages — human follow-up needed." This rule overrides everything else.

ESCALATION TO HUMAN (MANDATORY):
Set action to "escalate" and fill "escalation_reason" when ANY of these occur:

HARD TRIGGERS (always escalate):
- Client mentions legal action, lawsuits, or attorney involvement
- Client files a discrimination or Fair Housing complaint
- Client requests ADA/accessibility accommodations
- Client reports a maintenance emergency (gas leak, flooding, fire, lockout)
- Client requests contract modifications or lease exceptions
- Client uses threatening or abusive language
- Client asks for owner's personal contact information

SOFT TRIGGERS (escalate after pattern detected):
- Client asks the SAME question 2+ times and you still cannot answer it from the database
- Client expresses clear frustration or confusion ("I don't understand", "this doesn't make sense", "you're not helping", "I give up", etc.)
- Client makes a request that is completely outside your scope (legal advice, price negotiation beyond listing, custom lease terms, accessibility needs)
- You have answered to the best of your ability but the client is still unsatisfied after 2+ exchanges
- **4 consecutive unintelligible messages**: You already asked the client to clarify three times, and their message is STILL gibberish/nonsensical — escalate immediately, do not ask a fourth time

When escalating:
- Set "escalation_reason" to a short, specific sentence explaining WHY (e.g. "Client asked about lease modification twice; outside AI scope")
- Write a warm, empathetic reply acknowledging their concern and letting them know a human agent will follow up shortly
- Do NOT try to solve the issue yourself in the same message

SIGNATURE:
Sign your first reply and replies where the client introduced themselves with REALTOR_NAME (provided in context). Example: "Best regards, [Name]". Subsequent messages in the same thread do not need a signature unless the context changes.

=== CRITICAL GUARDRAILS (ABSOLUTE — VIOLATION = SYSTEM FAILURE) ===
1. DATABASE-ONLY: Every property fact (address, price, bedrooms, pet policy, amenities, availability, fees) MUST come verbatim from the PROPERTIES DATABASE. No exceptions.
2. NO INFERENCE: Do NOT infer, estimate, or extrapolate property details. If a detail is absent from the database, it is simply unknown — acknowledge it naturally without a fixed phrase.
3. NO INVENTION: NEVER create, assume, or hallucinate properties, addresses, prices, amenities, or any other data.
4. NO MATCH = HONEST: If no properties fit, say so clearly in your own words. Do NOT create a hypothetical listing.
5. MEETINGS: NEVER confirm or propose a meeting time the client did not explicitly state or agree to.
6. CLIENT DATA: Record client preferences ONLY from what they explicitly state.
7. NO MEDIA EVER: NEVER include image URLs, photo links, Unsplash links, or ANY media references anywhere in your output — not in reply text, not in JSON fields, not in suggestedProperties, nowhere. Images are loaded exclusively from the property database by the system. You have zero ability to generate, suggest, or reference images.
==================================================================
`;

const geminiJsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
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
  escalation_reason?: string;
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
      "neighborhoods_must": ["Capitol Hill", "Downtown"],
      "neighborhoods_exclude": ["SODO"],
      "text_pref": "any area",
      "commute_destination": "Amazon HQ, Seattle",
      "commute_max_minutes": 30,
      "commute_mode": "public-transit"
    },
    "housing": {
      "property_types": ["rent"], // Extract passively: "rent"/"lease"/"renting" → ["rent"]; "buy"/"purchase"/"buying" → ["buy"]. NEVER ask if already stated in any message.
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
  "summary": "Brief text summary",
  "escalation_reason": "Short reason why escalation was triggered, or null",
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

STRICT ANTI-HALLUCINATION RULES (ABSOLUTE — CRITICAL ARBITER):
1. DATABASE-ONLY OUTPUT: Every property fact (address, price, bedrooms, description, pet policy, fees, availability, amenities) MUST exist verbatim in the PROPERTIES DATABASE below. Zero tolerance.
2. NO INVENTION: Do NOT invent, estimate, or paraphrase property data. Copy facts directly from the database.
3. NO MATCH = HONEST: If no properties fit, say so clearly. Do NOT create a hypothetical listing.
4. NO EXTERNAL DATA: Do not reference any URLs, images, listings, or services not in the database.
5. FEATURE LOOKUP (CRITICAL): When asked about any feature, scan EVERY property's description AND amenities array first. Give a clear YES/NO answer per property. Only defer to "viewing" for subjective/conditional details — NEVER for factual presence/absence of a feature.
6. PRICE PRECISION: State prices exactly as they appear in the database. Do not round or modify.
7. NO MEDIA: NEVER include image URLs or photo references in your reply text.

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
    const firstName = (context.tenant.name || 'there').split(' ')[0];
    return `Hi ${firstName}, thanks for your message! I'm just a moment away — let me pull up the details for you.`;
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
    You are a strict Auditor. Your task is to check a "Generated Message" for INVENTED property addresses.
    
    KNOWN PROPERTIES (FACTS):
    ${knownAddresses.map(addr => `- ${addr}`).join('\n')}
    ${knownAddresses.length === 0 ? 'No properties available.' : ''}
    
    GENERATED MESSAGE:
    "${responseText}"
    
    TASK:
    1. Find any STREET ADDRESSES (format: "123 Street Name") mentioned in the message.
    2. A hallucination is ONLY if the message contains a specific STREET ADDRESS that is NOT in the KNOWN PROPERTIES list above.
    3. Neighborhood names (Capitol Hill, Queen Anne, Belltown, Downtown, etc.), city names, and general descriptions are NOT hallucinations — they may come from property descriptions.
    4. Prices, bedroom counts, and amenities that match a known property are NOT hallucinations.
    
    RETURN ONLY VALID JSON:
    {
      "hasHallucinations": boolean,
      "hallucinatedAddresses": ["only invented street addresses here"],
      "reason": "Brief explanation"
    }
  `;

  try {
    const result = await generateContentWithRetry(geminiFlashModel, verificationPrompt);
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

export interface CombinedResult {
  analysis: AiAnalysis;
  reply: string;
}

/**
 * OPTIMIZED: Single-call analyze + respond using gemini-2.0-flash.
 * Replaces the two sequential gemini-2.5-pro calls (analyzeConversation + generateFinalResponse).
 * ~3-5x faster.
 */
export async function analyzeAndRespond(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): Promise<CombinedResult> {
  const { tenant, properties, conversationHistory } = context;
  const realtorName = context.realtorName || 'Agent';
  const realtorPhone = context.realtorPhone || '';

  const buildPropertiesText = (compact = false) => properties.map(p => {
    if (compact) {
      // Minimal version for retry — just key facts
      return `- ${p.address}: ${p.price}, ${p.bedrooms}bd, pets=${p.pet_policy || 'unknown'}, available=${p.available_from || 'now'}`;
    }
    const amenitiesList = Array.isArray(p.amenities) && p.amenities.length > 0
      ? `Amenities: [${p.amenities.join(', ')}].`
      : 'Amenities: none listed.';
    const parking = p.parking_type ? `Parking: ${p.parking_type}${p.parking_fee ? ` (+$${p.parking_fee}/mo)` : ''}.` : '';
    const deposit = p.security_deposit ? `Deposit: $${p.security_deposit}.` : '';
    const appFee = p.application_fee ? `App fee: $${p.application_fee}.` : '';
    // Truncate description to 400 chars max to avoid token overflow
    const desc = (p.description || 'No description.').slice(0, 400);
    return `PROPERTY:
  Address: ${p.address}
  Price: ${p.price} | Bedrooms: ${p.bedrooms} | Status: ${p.status} | Available: ${p.available_from || 'now'} | Pets: ${p.pet_policy || 'unknown'}
  ${amenitiesList}
  ${parking} ${deposit} ${appFee}
  Description: ${desc}`;
  }).join('\n\n');

  const propertiesText = buildPropertiesText(false);

  const historyText = conversationHistory.map(m =>
    `${m.role === 'user' ? 'Client' : 'Agent'}: ${m.content}`
  ).join('\n');

  const now = new Date();
  const currentDateContext = `${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;

  const executionNote = executionResult?.success
    ? `\nCALENDAR BOOKING SUCCEEDED: link=${executionResult.data?.htmlLink}, time=${executionResult.data?.start?.dateTime}`
    : executionResult?.error
      ? `\nCALENDAR BOOKING FAILED: ${executionResult.error}`
      : '';

  const prompt = `${QUALIFICATION_SYSTEM_PROMPT}

ANTI-HALLUCINATION (ABSOLUTE — READ-ONLY MODE):
You are a READ-ONLY agent. Every property fact you mention MUST come directly from the PROPERTIES DATABASE below.
- FORBIDDEN: Inventing, guessing, estimating, or inferring ANY property attribute.
- FORBIDDEN: Describing features not explicitly in the Description or Amenities fields.
- FORBIDDEN: Including image URLs or any media references in your output.
- If no matching properties exist: say so honestly. Never invent a fallback listing.

FEATURE LOOKUP RULE (CRITICAL — follow this every time a client asks about a specific feature):
1. Scan the specific property's "Description" AND "Amenities" fields for the requested feature (and synonyms).
2. Answer in this structure:
   - If found → "Yes, it has [feature] — [quote from data]."
   - If NOT found → "(a) What IS listed: [describe what's in the data]. (b) [Feature] isn't specifically mentioned. (c) I'll check with the landlord and get back to you with a confirmed answer."
   - If a similar feature exists → mention it: "No X listed, but it does have Y."
3. BANNED PHRASES (never use for factual questions):
   - "we can confirm during a viewing"
   - "you can check at the viewing"
   - "this is something to confirm when you visit"
   These phrases are ONLY allowed for truly physical/subjective details: room dimensions, noise levels, natural light, finish quality, neighbourhood feel.
4. For appliances, electronics, furniture items (TV, dishwasher, washer/dryer, sofa, desk) — always offer to contact the landlord for confirmation, never send client to find out themselves.

PROPERTIES DATABASE:
${propertiesText || 'No properties available.'}

CONTEXT:
REALTOR_NAME: ${realtorName}
REALTOR_PHONE: ${realtorPhone}
Client: ${tenant.name} (${tenant.email || 'sandbox@test.com'})
CURRENT DATE/TIME: ${currentDateContext}
TIMEZONE: America/Los_Angeles (Pacific Time)
${executionNote}

CONVERSATION:
${historyText}

TASK: Analyze the client's latest message and generate a response. Return ONLY valid JSON:
{
  "thought_process": "Internal reasoning",
  "intent": "general",
  "action": "reply",
  "action_params": { "start_time": "", "property_address": "", "client_name": "", "duration_minutes": 30 },
  "listing_addresses": [],
  "extractedData": {
    "personal": { "firstName": "", "lastName": "" },
    "timeline": { "move_in_date": "", "lease_term_ideal_months": null },
    "budget": { "max_monthly_rent": null, "budget_stated": null, "budget_currency": "USD", "budget_usd": null },
    "housing": { "property_types": [], "bedrooms_min": null },
    "occupants": { "total_count": null },
    "pets": { "has_pets": null },
    "amenities": {}
  },
  "summary": "Brief summary",
  "escalation_reason": null,
  "priority": "warm",
  "suggestedProperties": [],
  "propertyMatches": ${JSON.stringify(
    properties.map(p => ({ address: p.address, score: 0, reason: 'Awaiting context' }))
  )},
  "reply": "The actual message text to send to the client (follow all CORE PRINCIPLES for tone and language)"
}

IMPORTANT:
- Only include extractedData fields actually found in this conversation. Leave others out.
- The "reply" field is the final message body sent to the client. Follow all system prompt rules.
- Match client language (Russian → Russian, English → English).
- NEVER append "Equal Housing Opportunity" or any legal disclaimer text to the reply. It is shown permanently in the UI footer. Adding it to messages makes the AI look robotic.
- Hard gate: if any of [timeline.lease_duration, housing.property_types, timeline.move_in_date, financial.budget_usd, occupants.total_count, pets.has_pets, housing.bedrooms_min] is missing → action="reply". Apply SMART BUNDLING (ask max 2 related questions per message). PASSIVE EXTRACTION: if the client already stated an answer (e.g. "need to rent" → property_types=["rent"], "no pets" → has_pets=false), extract it silently and do NOT ask again.
- MANDATORY: "propertyMatches" MUST always contain ALL properties listed in the PROPERTIES DATABASE above, each with a score 0-100 and a brief reason. Never omit any property from this array.
- MANDATORY SCORING: Apply the SCORING FORMULA from the system prompt exactly. Budget is the #1 factor. A property priced above the client's budget CANNOT score above: 75 (if <=10% over), 60 (if <=20% over), 45 (if <=35% over), 30 (if >35% over). Never give 80+ to an over-budget property. Properties with FEWER bedrooms than the client's minimum CANNOT score above 60 (1 short) or 40 (2+ short). SWEET SPOT: properties priced at 85-100% of budget and matching bedrooms should score highest.`;

  const parseResponse = (text: string) => {
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    const parsed = JSON.parse(cleanText);
    const { reply, ...analysisFields } = parsed;
    return {
      analysis: analysisFields as AiAnalysis,
      reply: reply || `Hi ${(tenant.name || 'there').split(' ')[0]}, thanks for your message. I'll get back to you shortly.`,
    };
  };

  // Attempt 1 — full prompt
  try {
    const result = await generateContentWithRetry(geminiFlashModel, prompt);
    const text = result.response.text();
    console.log('🔍 analyzeAndRespond attempt 1 (first 300):', text.substring(0, 300));
    return parseResponse(text);
  } catch (err1: any) {
    console.warn('⚠️ analyzeAndRespond attempt 1 failed:', err1?.message);
  }

  // Attempt 2 — compact prompt (shorter properties, recent history only)
  try {
    console.log('🔄 Retrying with compact prompt...');
    const compactPropertiesText = buildPropertiesText(true);
    const recentHistory = conversationHistory.slice(-6); // last 3 exchanges
    const compactHistoryText = recentHistory.map(m =>
      `${m.role === 'user' ? 'Client' : 'Agent'}: ${m.content}`
    ).join('\n');

    const compactPrompt = `${QUALIFICATION_SYSTEM_PROMPT}

PROPERTIES DATABASE:
${compactPropertiesText || 'No properties available.'}

CONTEXT:
Client: ${tenant.name} | Date: ${new Date().toLocaleDateString('en-US')}
${executionNote}

RECENT CONVERSATION:
${compactHistoryText}

TASK: Analyze the client's latest message and respond. Return ONLY valid JSON matching this schema:
{"thought_process":"...","intent":"general","action":"reply","listing_addresses":[],"extractedData":{},"propertyMatches":${JSON.stringify(properties.map(p => ({ address: p.address, score: 0, reason: '' })))},"summary":"","reply":""}`;

    const result2 = await generateContentWithRetry(geminiFlashModel, compactPrompt);
    const text2 = result2.response.text();
    console.log('🔍 analyzeAndRespond attempt 2 (first 300):', text2.substring(0, 300));
    return parseResponse(text2);
  } catch (err2: any) {
    console.error('❌ analyzeAndRespond both attempts failed:', err2?.message);
  }

  // Both attempts failed — escalate to human
  const firstName = (tenant.name || 'there').split(' ')[0];
  return {
    analysis: {
      thought_process: 'AI processing error after 2 attempts — escalating to human',
      intent: 'general',
      action: 'escalate',
      escalation_reason: 'AI failed to process the message after multiple attempts',
    } as AiAnalysis,
    reply: `Hi ${firstName}, I want to make sure you get the best assistance. Let me connect you with one of our agents right away.`,
  };
}
