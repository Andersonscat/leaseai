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
    maxOutputTokens: 8192,
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
   - Check IS_FIRST_MESSAGE in the CONTEXT section below.
   - If IS_FIRST_MESSAGE is true: include the AI disclosure ONCE: "I'm an AI leasing assistant for [property/company]. A licensed human agent is always available if you'd prefer to speak with someone directly."
   - If IS_FIRST_MESSAGE is false: DO NOT include ANY AI disclosure or introduction. Jump straight into your answer. NEVER re-introduce yourself. NEVER say "Hi [Name], I'm an AI..." again. The client already knows who you are.
   - Only exception: if the client explicitly asks "are you a bot/AI/human?" — confirm you are an AI.
   - NEVER claim to be human.

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

   ANNUAL BUDGET RULE (non-negotiable):
   - If the client states a budget "per year" or "annually" — ACCEPT IT. Do NOT question it.
   - Internally convert: monthly = stated_amount / 12. Store this monthly value in extractedData.financial.budget_usd AND in extractedData.budget.max_monthly_rent.
   - Example: "$24,000 a year" → budget_usd: 2000, max_monthly_rent: 2000, budget_stated: "$24,000/year"
   - Record budget_stated as the original annual figure.
   - If the converted monthly amount is below all available properties, inform the client once, matter-of-factly:
     "Our available properties start at $X/month ($Y/year). Would you like to explore options in that range?"
   - NEVER say things like "a 2-bedroom typically costs more", "are you sure?", or ask the client to re-confirm a budget they already stated clearly. That is condescending and damages trust.
   - The client knows their own budget. Your job is to work with it, not to audit it.

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
   - Apply SMART BUNDLING: ask max 2 logically related missing fields per message (e.g. "How many people and any pets?" — not one by one).
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
   - Apply SMART BUNDLING: ask max 2 logically related missing fields per message. Never interrogate one by one.
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
- When recommending properties for the **first time**, present the **top 2–3 best matches** only. Do NOT dump all available options — this overwhelms the client. Quality over quantity.
- If the client has **already seen properties** and asks for more options ("what else?", "any other?", "show more"), you may then present 2–3 additional ones.
- For each property, mention: address, price, bedrooms, and one unique selling point from the description.
- If you decide to recommend properties, set action to "send_listing" with property addresses in "listing_addresses". The system will AUTOMATICALLY display property cards with photos directly in the chat — you do NOT need to send photos manually.
- Always explain WHY each property is a good fit for this specific client.
- **BUDGET GAP RULE**: If you recommend a property that is over the client's stated budget, YOU MUST ACKNOWLEDGE IT. Say something like: "I know this is above your $2,000 target, but it checks all your other boxes..." Never ignore the price difference.
   - **EQUAL HOUSING**: Do NOT append any Equal Housing disclaimer text to your messages. It is displayed permanently in the chat UI footer.

PHOTOS & IMAGES:
- Property photos are displayed AUTOMATICALLY in the chat whenever you use the "send_listing" action. The client can see them directly.
- NEVER say "I can't send images" or "I can't send photos directly" — this is false. Photos ARE sent directly in the chat.
- If a client asks for photos of a specific property (e.g. "send me pictures of option 2", "can I see more photos?", "show photos"):
  1. Set action to "send_listing"
  2. Set "listing_addresses" to that property's address only
  3. Set "photo_mode": true in your JSON response (MANDATORY for photo requests)
  4. Say ONLY something like: "Here are all the photos for [address]." — do NOT say "you can see them in the property card below"
- If a client asks for photos of ALL listed properties at once, set photo_mode: true and include all addresses in listing_addresses.
- NEVER say "you can see them in the property card" when responding to a photo request.
- NEVER invent, describe, or reference specific photo content (e.g. "the kitchen has white cabinets") unless that detail is in the property description text in the database.

PENDING CHECKS (MANDATORY — track every promise to verify):
- Whenever you tell the client "I'll check with the landlord", "I'll confirm that", "I'll find out", or similar — you MUST add an entry to "pending_checks" in your JSON:
  { "property_address": "full address", "question": "concise description of what needs to be verified" }
- Examples:
  Client asks about coworking → AI says "I'll check" → pending_checks: [{ property_address: "19128 112th Ave NE, Bothell, WA", question: "Coworking area availability and WiFi speed" }]
  Client asks about pet deposit → AI says "I'll confirm" → pending_checks: [{ property_address: "...", question: "Pet deposit amount" }]
- ACCUMULATE: always include ALL previously logged pending_checks from earlier in the conversation PLUS any new ones. Never drop a pending item that was added before.
- When a pending item is resolved (answer found in DB or confirmed), REMOVE it from pending_checks.

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
   - If Lease Duration is still unknown, use "preliminary match" language — the system handles scoring.
   - Always state explicitly WHAT you are matching on (e.g., "This matches your $2,500 budget and 2-bedroom requirement") — never make blanket claims like "aligns with all your requirements" if there are still unknowns.

5. **PROPERTY MATCHING (SYSTEM-HANDLED)**:
   - Property scoring and ranking is done automatically by the system. You do NOT compute propertyMatches scores.
   - When you want to recommend properties, set action to "send_listing". The system will display the best matches (3-5) based on budget, bedrooms, pets, availability, and features.
   - In your reply text: mention properties from the database that fit the client's criteria. Present them in order of fit (best first). Include nearby metro areas (e.g. Bothell for Seattle) when they match budget/bedrooms.
   - If a property is over budget, acknowledge it: "I know this is above your $X target, but..."
   - propertyMatches in your JSON can be empty or placeholder — the system overwrites with deterministic scores.

6. CLARIFICATION & ROBUSTNESS (GIBBERISH DETECTION)
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

BUDGET DISQUALIFICATION (escalate gracefully — do NOT loop):
This is one of the most common situations in leasing. Handle it with dignity.

STEP 1 — Gap detected: Client's budget is below all available properties.
  → Inform them once, matter-of-factly: "Our available properties start at $X/month. Unfortunately nothing in our current inventory fits a $Y/month budget."
  → Offer ONE alternative: "Would you like to explore 1-bedroom options, or a different area that might be more affordable?"

STEP 2 — Client declines the alternative (says "no", "can't afford that", "sorry I can't pay that much", "too expensive", etc.):
  → STOP. Do NOT offer more alternatives. Do NOT ask again.
  → Immediately set action to "escalate" with escalation_reason: "Budget below minimum inventory — client confirmed they cannot afford available options"
  → Reply warmly and close the loop:
    "I completely understand — budgets are real, and I don't want to keep suggesting things that don't work for you. I'll flag your details for our team, and if anything comes up in your range we'll be sure to reach out. Is there a best way to contact you?"
  → After this message, go silent. The human team takes over.

KEY RULE: Never loop past Step 2. One gap notice + one alternative offer = your limit. Continuing to push is spam and damages trust. Industry leaders (Elise, Knock, Funnel) all stop here.

When escalating:
- Set "escalation_reason" to a short, specific sentence explaining WHY (e.g. "Client asked about lease modification twice; outside AI scope")
- Write a warm, empathetic reply acknowledging their concern and letting them know a human agent will follow up shortly
- Do NOT try to solve the issue yourself in the same message

SIGNATURE:
Sign your first reply and replies where the client introduced themselves with REALTOR_NAME (provided in context). Example: "Best regards, [Name]". Subsequent messages in the same thread do not need a signature unless the context changes.

=== CRITICAL GUARDRAILS (ABSOLUTE — VIOLATION = SYSTEM FAILURE) ===
1. DATABASE-ONLY: Every property fact (address, price, bedrooms, pet policy, amenities, availability, fees) MUST come verbatim from the PROPERTIES DATABASE. No exceptions.
2. NO INFERENCE: Do NOT infer, estimate, or extrapolate property details. If a detail is absent from the database, say "I don't have that information in our records" or "I can check with the landlord". NEVER say "yes" or confirm a feature that is not explicitly listed.
3. NO INVENTION: NEVER create, assume, or hallucinate properties, addresses, prices, amenities, or any other data. When in doubt — it is unknown.
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
    topP: 0.4,
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
  // DB row fields (may differ from interface names)
  price_monthly?: number;
  beds?: number;
  baths?: number;
  bathrooms?: number;
  sqft?: number;
  city?: string;
  state?: string;
  type?: string;
  // Zillow-aligned fields
  available_from?: string;
  pet_policy?: string;
  price_amount?: number;
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
  realtorCompany?: string;
  timezone?: string;
  viewingHoursStart?: string;
  viewingHoursEnd?: string;
  defaultLanguage?: string;
  /** Pre-computed ranked property matches (deterministic). When provided, AI must write about these properties in this order. */
  preRankedMatches?: Array<{ address: string; score: number; reason: string; price?: any; beds?: number; baths?: number; sqft?: number }>;
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
  summary?: {
    client: string;
    interests: string;
    concerns: string;
    next_step: string;
  } | string; // structured guest card summary
  priority?: 'hot' | 'warm' | 'cold';
  suggestedProperties?: string[];
  listing_addresses?: string[];
  photo_mode?: boolean; // true when client explicitly asked for photos
  pending_checks?: {
    property_address: string;
    question: string; // What needs to be confirmed with landlord
  }[];
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
  const realtorCompany = context.realtorCompany || '';
  const timezone = context.timezone || 'America/Los_Angeles';
  const viewingStart = context.viewingHoursStart || '10:00';
  const viewingEnd = context.viewingHoursEnd || '20:00';

  const propertiesText = properties.map(p => 
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

  const historyText = conversationHistory.map(m => 
    `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`
  ).join('\n');

  // Dynamic date context so AI can resolve "tomorrow", "next Monday", etc.
  const now = new Date();
  const currentDateContext = `${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;

  const preRankedSection = context.preRankedMatches && context.preRankedMatches.length > 0
    ? `\nPRE-RANKED MATCHES (use EXACTLY these when recommending, in this order):\n${context.preRankedMatches.map((m, i) => `Option ${i + 1}: ${m.address} — score ${m.score}/100 — $${m.price}/mo, ${m.beds ?? '?'}bd/${m.baths ?? '?'}ba (${m.reason})`).join('\n')}\nRULE: Your reply text MUST only mention properties from this list, in order. Do NOT recommend properties not listed here.\nPHOTO REQUESTS: "option 1"/"first option" → Option 1 address; "option 2"/"second option" → Option 2 address. Set photo_mode=true and listing_addresses=[address] for photo requests.\n`
    : '';

  const analysisPrompt = `
CONTEXT:
REALTOR_NAME: ${realtorName}${realtorCompany ? ` (${realtorCompany})` : ''}
Client: ${tenant.name} (${tenant.email})
CURRENT DATE/TIME: ${currentDateContext}
TIMEZONE: ${timezone}
VIEWING HOURS: ${viewingStart}–${viewingEnd} (${timezone})
${preRankedSection}Properties:
${propertiesText}

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
      "city": "Seattle", // ALWAYS extract if mentioned. Even from context like "Capitol Hill" → city="Seattle".
      "state": "WA", // ALWAYS infer the US state abbreviation from the city. "Seattle" → "WA", "Austin" → "TX", "Miami" → "FL". NEVER leave blank if city is known.
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
  "summary": {
  },
  "thought_process": "Detailed internal reasoning — output LAST so truncation only affects this field"
}

IMPORTANT: Evaluate ALL available properties listed above against the current client requirements (extractedData) and provide a match score (0-100) and a brief reason for each. A high score (80+) means it meets most mini-core requirements. Sort by score in your internal reasoning.

IMPORTANT: Only include extractedData fields that you actually found in THIS message or earlier in the conversation. Leave fields out if not mentioned. Do NOT include placeholder values or null fields.
`;

  try {
    const result = await generateContentWithRetry(geminiJsonModel, analysisPrompt);
    const text = result.response.text();
    
    // Robust JSON parsing — handles truncated responses
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    let analysis: AiAnalysis;
    try {
      analysis = JSON.parse(cleanText) as AiAnalysis;
    } catch {
      // Log truncated tail for debugging
      console.error('⚠️ JSON truncated. Last 300 chars:', cleanText.slice(-300));
      // Try to salvage: grab everything up to the last complete top-level field
      // by finding the last valid closing and appending missing braces
      let attempt = cleanText;
      // Count unclosed braces/brackets
      let braces = 0; let brackets = 0;
      for (const ch of attempt) {
        if (ch === '{') braces++; else if (ch === '}') braces--;
        if (ch === '[') brackets++; else if (ch === ']') brackets--;
      }
      // Close open arrays first, then objects
      attempt += ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
      try {
        analysis = JSON.parse(attempt) as AiAnalysis;
      } catch {
        throw new SyntaxError('Could not repair truncated JSON');
      }
    }
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
 * PHASE 3: THE VOICE
 * Generate the final message text. Sees ONLY selectedProperties (not the full DB).
 * @param selectedProperties - The 1-5 properties chosen by code. Pass empty array for non-property responses.
 */
export async function generateFinalResponse(
  context: ConversationContext, 
  analysis: AiAnalysis,
  executionResult?: { success: boolean; data?: any; error?: string },
  selectedProperties?: Property[]
): Promise<string> {
  console.log('🗣️ AI Voice: Generating response...');

  // Use selectedProperties if provided, otherwise fall back to context.properties (backward compat)
  const visibleProperties = selectedProperties ?? context.properties;
  
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
    TASK: Present ALL ${visibleProperties.length} properties listed in the PROPERTIES section below. You MUST mention EVERY property — do NOT skip any.
    For each property: mention its address, price, bedrooms, and one unique selling point from its description.
    The system will automatically attach property cards with photos — do NOT mention photos or say you are sending them.
    CRITICAL: You received ${visibleProperties.length} properties. Your reply MUST reference all ${visibleProperties.length}. If you skip any, the client will see a card with no matching description, which is confusing.
    Focus on: ${analysis.thought_process}
    `;
  } else if (analysis.action === 'escalate') {
    instructions = `
    TASK: The situation requires human attention. Write a professional message letting the client know you are connecting them with a team member who can better assist.
    Reason for escalation: ${analysis.thought_process}
    `;
  } else {
    instructions = `
    TASK: Write a helpful response based on your analysis.
    Focus on: ${analysis.thought_process}
    `;
  }
 
  const realtorName = context.realtorName || 'Agent';
  const realtorCompany2 = context.realtorCompany || '';
  const timezone2 = context.timezone || 'America/Los_Angeles';
  const viewingStart2 = context.viewingHoursStart || '10:00';
  const viewingEnd2 = context.viewingHoursEnd || '20:00';

  // Build detailed text ONLY for selected properties (not the entire DB)
  let propertiesText: string;
  if (visibleProperties.length > 0) {
    propertiesText = visibleProperties.map((p, i) => {
      const price = p.price_monthly || p.price;
      const beds = p.beds ?? p.bedrooms;
      const baths = p.baths ?? p.bathrooms;
      const amenitiesList = Array.isArray(p.amenities) && p.amenities.length > 0
        ? `Amenities: [${p.amenities.join(', ')}].` : '';
      const parking = p.parking_type ? `Parking: ${p.parking_type}${p.parking_fee ? ` (+$${p.parking_fee}/mo)` : ''}.` : '';
      const desc = (p.description || '').slice(0, 400);
      return `Option ${i + 1}:
  Address: ${p.address}
  Price: $${price || 'Unknown'}/month | Bedrooms: ${beds ?? 'Unknown'} | Bathrooms: ${baths ?? 'Unknown'} | Sqft: ${p.sqft || 'Unknown'}
  Available: ${p.available_from || 'now'} | Pets: ${p.pet_policy || 'unknown'}
  ${amenitiesList} ${parking}
  Description: ${desc}`;
    }).join('\n\n');
  } else {
    propertiesText = 'No properties selected for this response.';
  }

  const historyText = context.conversationHistory.map(m => 
    `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`
  ).join('\n');

  const hasAgentMessages = context.conversationHistory.some(m => m.role === 'assistant');
  const isFirstMessage = !hasAgentMessages;

  const prompt = `
${QUALIFICATION_SYSTEM_PROMPT}

ANTI-HALLUCINATION (ABSOLUTE):
You may ONLY reference property data from the PROPERTIES section below. These are the ONLY properties you know about.
- FORBIDDEN: Inventing, guessing, or inferring ANY property attribute not listed below.
- FORBIDDEN: Including image URLs or photo references in your text.
- If asked about a feature: check Description and Amenities below. Answer YES/NO factually. If not listed, offer to check with the landlord.
- PRICE PRECISION: State prices exactly as shown. Do not round.

PROPERTIES (these are the ONLY properties you may reference):
${propertiesText}

CONVERSATION CONTEXT:
REALTOR_NAME: ${realtorName}${realtorCompany2 ? ` (${realtorCompany2})` : ''}
TIMEZONE: ${timezone2}
VIEWING HOURS: ${viewingStart2}–${viewingEnd2} (${timezone2})
IS_FIRST_MESSAGE: ${isFirstMessage}
Client: ${context.tenant.name}
History:
${historyText}

INSTRUCTIONS:
${instructions}

Style: Professional, concise, and helpful. Match the client's language (Russian → Russian, English → English).
(CRITICAL: Just write the conversational message body. Do NOT format links or contact info — another system appends those automatically.)
NEVER append "Equal Housing Opportunity" or any legal disclaimer to your message.

Generate ONLY the message body text. No JSON, no extra formatting.
`;

  try {
    const result = await generateContentWithRetry(geminiModel, prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ AI Voice failed:', error);
    const firstName = (context.tenant.name || 'there').split(' ')[0];
    return `Hi ${firstName}, thanks for your message! I'm just a moment away — let me pull up the details for you.`;
  }
}

/**
 * PHASE 4: THE JUDGE
 * Deterministic check — extract street addresses from the AI response and verify
 * they exist in the known properties list. No LLM call needed.
 */
export async function verifyResponseHallucinations(
  responseText: string,
  properties: Property[]
): Promise<VerificationResult> {
  console.log('⚖️ AI Judge: Verifying hallucinations (deterministic)...');

  if (!properties.length) {
    return { hasHallucinations: false, hallucinatedAddresses: [] };
  }

  const knownAddresses = properties.map(p => (p.address || '').toLowerCase().trim());

  // Match street addresses like "123 Main St", "4500 Broadway Ave", etc.
  const addressPattern = /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Ct|Court|Way|Pl|Place|Cir|Circle|Pkwy|Parkway|Ter|Terrace|Loop|Trail|Run|Pass)\b\.?/gi;

  const foundAddresses = responseText.match(addressPattern) || [];
  const hallucinatedAddresses: string[] = [];

  for (const addr of foundAddresses) {
    const normalized = addr.toLowerCase().trim().replace(/\.$/, '');
    const isKnown = knownAddresses.some(known =>
      known.includes(normalized) || normalized.includes(known.split(',')[0].trim())
    );
    if (!isKnown) {
      hallucinatedAddresses.push(addr);
    }
  }

  if (hallucinatedAddresses.length > 0) {
    console.warn('🚨 Hallucinated addresses found:', hallucinatedAddresses);
  }

  return {
    hasHallucinations: hallucinatedAddresses.length > 0,
    hallucinatedAddresses,
    reason: hallucinatedAddresses.length > 0
      ? `Found ${hallucinatedAddresses.length} address(es) not in property list: ${hallucinatedAddresses.join(', ')}`
      : undefined,
  };
}

/**
 * Calculate lead score based on tenant data completeness (0-100).
 */
export function calculateLeadScore(tenant: Partial<TenantData> & Record<string, any>): number {
  let points = 0;
  const max = 100;

  // Contact info (max 15)
  if (tenant.name) points += 5;
  if (tenant.email) points += 5;
  if (tenant.phone) points += 5;

  // Budget (max 20) — check both old and new fields
  if (tenant.budget_max || tenant.budget_min || tenant.budget) points += 20;

  // Timeline (max 15)
  if (tenant.move_in_date) points += 15;

  // Housing preferences (max 20)
  if (tenant.bedrooms != null) points += 7;
  if (tenant.bathrooms != null) points += 3;
  if (tenant.property_type) points += 5;
  if (tenant.lease_duration || tenant.lease_term_months) points += 5;

  // Lifestyle (max 10)
  if (tenant.has_pets !== undefined) points += 3;
  if (tenant.num_occupants != null || tenant.occupants != null) points += 3;
  if (tenant.needs_parking !== undefined || tenant.parking_needed !== undefined) points += 2;
  if (tenant.furnishing) points += 2;

  // Location (max 10)
  if (tenant.preferred_neighborhoods && (
    Array.isArray(tenant.preferred_neighborhoods) ? tenant.preferred_neighborhoods.length > 0 : true
  )) points += 10;

  // Amenities & specifics (max 10)
  if (tenant.must_haves && (Array.isArray(tenant.must_haves) ? tenant.must_haves.length > 0 : true)) points += 5;
  if (tenant.deal_breakers && (Array.isArray(tenant.deal_breakers) ? tenant.deal_breakers.length > 0 : true)) points += 5;

  return Math.min(points, max);
}

/**
 * Get lead quality label from score
 */
export function getLeadQuality(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

/**
 * Flatten nested extractedData (from AI) to flat tenant fields for scoring
 */
export function flattenExtractedData(ed: Record<string, any> | null | undefined): Record<string, any> {
  if (!ed || typeof ed !== 'object') return {};
  const flat: Record<string, any> = {};
  const budgetVal = ed.budget?.budget_usd ?? ed.budget?.max_monthly_rent ?? ed.budget_max;
  if (budgetVal != null) flat.budget_max = budgetVal;
  const moveIn = ed.timeline?.move_in_date ?? ed.move_in_date;
  if (moveIn) flat.move_in_date = moveIn;
  if (ed.timeline?.lease_term_ideal_months) flat.lease_duration = `${ed.timeline.lease_term_ideal_months}_months`;
  const bedrooms = ed.housing?.bedrooms_min;
  if (bedrooms != null) flat.bedrooms = bedrooms;
  const bathrooms = ed.housing?.bathrooms_min;
  if (bathrooms != null) flat.bathrooms = bathrooms;
  // Furnished: check housing.furnished first, then fall back to desired_features containing "furnished"
  if (ed.housing?.furnished) {
    flat.furnishing = ed.housing.furnished;
  } else if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.includes('furnished')) {
    flat.furnishing = 'yes';
  }
  if (Array.isArray(ed.housing?.property_types) && ed.housing.property_types.length > 0) {
    flat.property_type = ed.housing.property_types[0];
  }
  const occupants = ed.occupants?.total_count;
  if (occupants != null) flat.num_occupants = occupants;
  if (ed.pets?.has_pets !== undefined) flat.has_pets = ed.pets.has_pets;
  else if (ed.has_pets !== undefined) flat.has_pets = ed.has_pets;
  if (Array.isArray(ed.amenities?.desired_features) && ed.amenities.desired_features.length > 0) {
    flat.must_haves = ed.amenities.desired_features;
  }
  if (Array.isArray(ed.amenities?.deal_breakers) && ed.amenities.deal_breakers.length > 0) {
    flat.deal_breakers = ed.amenities.deal_breakers;
  }
  // Parking: check parking.required or desired_features containing a parking key
  if (ed.amenities?.parking?.required === 'required') {
    flat.needs_parking = true;
  } else if (Array.isArray(ed.amenities?.desired_features) &&
    ed.amenities.desired_features.some((f: string) => f.includes('parking'))) {
    flat.needs_parking = true;
  }
  if (Array.isArray(ed.location?.neighborhoods_must) && ed.location.neighborhoods_must.length > 0) {
    flat.preferred_neighborhoods = ed.location.neighborhoods_must;
  }
  if (ed.location?.city && typeof ed.location.city === 'string' && ed.location.city.trim()) {
    flat.preferred_city = ed.location.city.trim();
  }
  if (ed.location?.state && typeof ed.location.state === 'string' && ed.location.state.trim()) {
    flat.preferred_state = ed.location.state.trim();
  }
  return flat;
}

/** Tenant + property types for scoring (accept DB shape) */
type TenantLike = Partial<TenantData> & Record<string, any>;
type PropertyLike = Record<string, any>;

// ─── CLUSTER WEIGHTS ────────────────────────────────────────────────────────
// Location is the heaviest because you can negotiate price, move-in date,
// even room count — but you cannot move a building to another place.
const CLUSTER_WEIGHTS = {
  budget:    0.20,
  layout:    0.15,
  location:  0.35,
  timeline:  0.10,
  amenities: 0.10,
  lifestyle: 0.10,
} as const;

export interface ClusterBreakdown {
  budget:    number;
  layout:    number;
  location:  number;
  timeline:  number;
  amenities: number;
  lifestyle: number;
}

export interface ScoringResult {
  score: number;
  reason: string;
  clusters: ClusterBreakdown;
  disqualified?: string;
  isNearby?: boolean;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function parsePetPolicy(raw: string): boolean {
  const p = raw.toLowerCase();
  return p.includes('no_pet') || p === 'no_pets' || p === 'no pets' || p.includes('no pets allowed');
}

function collectAllFeatures(property: PropertyLike): string[] {
  const desc = (property.description || '').toLowerCase();
  const amenities = Array.isArray(property.amenities)
    ? property.amenities.map((a: any) => String(a).toLowerCase()) : [];
  const features = property.features
    ? (Array.isArray(property.features) ? property.features : Object.values(property.features))
        .map((f: any) => String(f).toLowerCase())
    : [];
  return [...amenities, ...features, desc];
}

function isPropFurnished(property: PropertyLike, allFeatures: string[]): boolean {
  return allFeatures.some(f => f.includes('furnished')) ||
    property.furnished === true || String(property.furnished || '').toLowerCase() === 'yes';
}

// ─── STATE INFERENCE FROM PROPERTY PORTFOLIO ────────────────────────────────
// Hardcoded city→state tables are unsafe because many US cities share names
// across states (Portland OR/ME, Springfield IL/MA/MO, Arlington TX/VA, etc.).
// Instead we infer the state from the landlord's own property portfolio —
// if they have a property in "Seattle, WA" and the client says "Seattle",
// we know the client means WA.

/**
 * Infer the US state from a city name by cross-referencing the landlord's
 * property portfolio. Returns the state abbreviation (lowercase) if exactly
 * one state matches, or null if ambiguous / no match.
 */
export function inferStateFromProperties(city: string, properties: PropertyLike[]): string | null {
  if (!city || !properties?.length) return null;
  const cityLow = city.toLowerCase().trim();

  const matchingStates = new Set<string>();
  for (const p of properties) {
    const propCity = (p.city || '').toString().toLowerCase().trim();
    const propState = (p.state || '').toString().toLowerCase().trim();
    if (propCity && propState && propCity === cityLow) {
      matchingStates.add(propState);
    }
  }

  // Unambiguous: exactly one state has a property in that city
  if (matchingStates.size === 1) {
    return Array.from(matchingStates)[0];
  }

  // Fallback: if no property directly matches the city, check if ALL
  // properties are in one state — the client likely means that state.
  if (matchingStates.size === 0) {
    const allStates = new Set<string>();
    for (const p of properties) {
      const s = (p.state || '').toString().toLowerCase().trim();
      if (s) allStates.add(s);
    }
    if (allStates.size === 1) return Array.from(allStates)[0];
  }

  return null; // ambiguous — don't guess
}

// ─── HARD DISQUALIFIERS (pre-filter) ────────────────────────────────────────

function checkHardDisqualifiers(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): string | null {
  const tenantState = (tenant.preferred_state || '').toString().toLowerCase().trim();
  const propState = (property.state || '').toString().toLowerCase().trim();

  // Note: if preferred_state is empty, state disqualification is skipped.
  // State inference happens at the API route level via inferStateFromProperties()
  // before scoring begins, so preferred_state should already be set by then.
  if (tenantState && propState && tenantState !== propState) {
    return `wrong state (want ${tenant.preferred_state}, property in ${property.state || 'unknown'})`;
  }

  const hasPets = tenant.has_pets === true;
  const petPolicy = (property.pet_policy || property.pets || '').toString();
  if (hasPets && parsePetPolicy(petPolicy)) {
    return 'no pets allowed (hard disqualify)';
  }

  const dealBreakers = Array.isArray(tenant.deal_breakers) ? tenant.deal_breakers : [];
  for (const db of dealBreakers) {
    const term = String(db).toLowerCase();
    if (allFeatures.some(ff => ff.includes(term))) {
      return `deal-breaker present: ${term}`;
    }
  }

  return null;
}

function matchesCity(tenantCity: string, propCity: string, propAddr: string): boolean {
  if (!tenantCity) return false;
  return propCity === tenantCity
    || propCity.includes(tenantCity)
    || tenantCity.includes(propCity)
    || propAddr.includes(tenantCity);
}

// ─── CLUSTER SCORING FUNCTIONS ──────────────────────────────────────────────
// Each returns 0.0–1.0 and a reason string

function scoreBudgetCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const budgetMax = tenant.budget_max != null
    ? Number(tenant.budget_max)
    : (tenant.budget ? parseInt(String(tenant.budget).replace(/[^0-9]/g, ''), 10) : null);
  const priceNum = property.price_monthly ?? property.price_amount
    ?? parseInt(String(property.price || '0').replace(/[^0-9]/g, ''));

  if (budgetMax == null || isNaN(priceNum) || budgetMax <= 0) {
    return { value: 0.5, reason: 'budget unknown' };
  }

  const ratio = priceNum / budgetMax;

  if (ratio <= 0.60) return { value: 0.55, reason: 'far below budget' };
  if (ratio <= 0.70) return { value: 0.70, reason: 'below budget' };
  if (ratio <= 0.85) return { value: 0.85, reason: 'under budget' };
  if (ratio <= 1.00) return { value: 1.00, reason: 'within budget' };
  if (ratio <= 1.05) return { value: 0.80, reason: 'slightly over budget' };
  if (ratio <= 1.10) return { value: 0.60, reason: '5-10% over budget' };
  if (ratio <= 1.20) return { value: 0.30, reason: '10-20% over budget' };
  return { value: 0.0, reason: 'far over budget (>20%)' };
}

function scoreLayoutCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const bedsNeeded = tenant.bedrooms ?? null;
  const propBeds = property.beds ?? property.bedrooms ?? 0;
  const bathsNeeded = tenant.bathrooms ?? null;
  const propBaths = property.baths ?? property.bathrooms ?? 0;
  const sqftMin = tenant.sqft_min ?? null;
  const propSqft = property.sqft ?? null;

  let bedScore = 1.0;
  let bedReason = '';
  if (bedsNeeded != null) {
    const diff = propBeds - bedsNeeded;
    if (diff >= 1) { bedScore = 0.95; bedReason = 'extra bedroom'; }
    else if (diff === 0) { bedScore = 1.0; bedReason = 'bedrooms match'; }
    else if (diff === -1) { bedScore = 0.3; bedReason = '1 bedroom short'; }
    else { bedScore = 0.0; bedReason = `${Math.abs(diff)} bedrooms short`; }
  }

  let bathScore = 1.0;
  let bathReason = '';
  if (bathsNeeded != null) {
    if (propBaths > bathsNeeded) { bathScore = 1.0; bathReason = 'extra bathroom'; }
    else if (propBaths === bathsNeeded) { bathScore = 1.0; bathReason = 'bathrooms match'; }
    else { bathScore = 0.5; bathReason = 'fewer bathrooms'; }
  }

  let sqftScore = 1.0;
  let sqftReason = '';
  if (sqftMin != null && propSqft != null) {
    const ratio = propSqft / sqftMin;
    if (ratio >= 1.0) { sqftScore = 1.0; sqftReason = 'meets sqft'; }
    else if (ratio >= 0.85) { sqftScore = 0.7; sqftReason = 'slightly small'; }
    else if (ratio >= 0.70) { sqftScore = 0.4; sqftReason = 'undersized'; }
    else { sqftScore = 0.1; sqftReason = 'much too small'; }
  }

  const value = bedScore * 0.60 + bathScore * 0.15 + sqftScore * 0.25;
  const reasons = [bedReason, bathReason, sqftReason].filter(Boolean);
  return { value: Math.min(1, value), reason: reasons.join('; ') || 'layout OK' };
}

function scoreLocationCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string; isNearby: boolean } {
  const tenantCity = (tenant.preferred_city || '').toString().toLowerCase().trim();
  const propCity = (property.city || '').toString().toLowerCase().trim();
  const propAddr = (property.address || '').toString().toLowerCase();
  const propNeighborhood = (property.neighborhood || '').toLowerCase();
  const reasons: string[] = [];
  let isNearby = false;

  // ── Tier 1: City matching (dominant factor) ──
  // Exact city = 1.0 | Same state different city = 0.40 | No pref = 0.5
  let cityScore = 0.5;
  if (tenantCity) {
    if (matchesCity(tenantCity, propCity, propAddr)) {
      cityScore = 1.0;
      reasons.push(`in ${property.city || tenantCity}`);
    } else {
      // Same state (hard filter already passed) but different city → "nearby"
      cityScore = 0.40;
      isNearby = true;
      reasons.push(`nearby city (${property.city || 'unknown'})`);
    }
  }

  // ── Tier 2: Neighborhood matching ──
  const prefNeighborhoods = Array.isArray(tenant.preferred_neighborhoods)
    ? tenant.preferred_neighborhoods.map((n: any) => String(n).toLowerCase())
    : (typeof tenant.preferred_neighborhoods === 'string' && tenant.preferred_neighborhoods
        ? [tenant.preferred_neighborhoods.toLowerCase()] : []);

  let neighborhoodScore = 0.5;
  if (prefNeighborhoods.length > 0) {
    const matched = prefNeighborhoods.some((n: string) =>
      propAddr.includes(n) || propNeighborhood.includes(n) || n.includes(propNeighborhood)
      || propCity.includes(n) || n.includes(propCity)
    );
    if (matched) {
      neighborhoodScore = 1.0;
      reasons.push('preferred neighborhood');
    } else {
      neighborhoodScore = 0.15;
      reasons.push('outside preferred area');
    }
  }

  // ── Tier 3: Walkability/transit/bike scores ──
  const walkScore = property.walk_score ?? null;
  const transitScore = property.transit_score ?? null;
  const bikeScore = property.bike_score ?? null;
  const hasWalkabilityData = walkScore != null || transitScore != null || bikeScore != null;

  let walkabilityScore = 0.5;
  if (hasWalkabilityData) {
    const scores = [walkScore, transitScore, bikeScore].filter((s): s is number => s != null);
    walkabilityScore = scores.reduce((sum, s) => sum + s, 0) / (scores.length * 100);
    reasons.push(`walkability ${Math.round(walkabilityScore * 100)}%`);
  }

  // ── Combine: city dominates (50%), neighborhood (25%), walkability (25%) ──
  const hasCityPref = !!tenantCity;
  const hasNeighborhoodPref = prefNeighborhoods.length > 0;

  let value: number;
  if (hasCityPref && hasNeighborhoodPref && hasWalkabilityData) {
    value = cityScore * 0.50 + neighborhoodScore * 0.25 + walkabilityScore * 0.25;
  } else if (hasCityPref && hasNeighborhoodPref) {
    value = cityScore * 0.60 + neighborhoodScore * 0.40;
  } else if (hasCityPref && hasWalkabilityData) {
    value = cityScore * 0.65 + walkabilityScore * 0.35;
  } else if (hasCityPref) {
    value = cityScore;
  } else if (hasNeighborhoodPref && hasWalkabilityData) {
    value = neighborhoodScore * 0.65 + walkabilityScore * 0.35;
  } else if (hasNeighborhoodPref) {
    value = neighborhoodScore;
  } else if (hasWalkabilityData) {
    value = walkabilityScore;
  } else {
    value = 0.5;
    reasons.push('location data limited');
  }

  return { value: Math.min(1, value), reason: reasons.join('; ') || 'location OK', isNearby };
}

function scoreTimelineCluster(tenant: TenantLike, property: PropertyLike): { value: number; reason: string } {
  const moveIn = tenant.move_in_date ? new Date(tenant.move_in_date) : null;
  const availableFrom = property.available_from ? new Date(property.available_from) : null;

  if (!moveIn || !availableFrom || isNaN(availableFrom.getTime())) {
    return { value: 0.5, reason: 'timeline unknown' };
  }

  const daysAfter = Math.round((availableFrom.getTime() - moveIn.getTime()) / (24 * 60 * 60 * 1000));

  if (daysAfter <= 0) return { value: 1.0, reason: 'available on time' };
  if (daysAfter <= 7) return { value: 0.8, reason: 'available within a week' };
  if (daysAfter <= 14) return { value: 0.5, reason: 'available in 1-2 weeks' };
  if (daysAfter <= 30) return { value: 0.2, reason: 'available in 2-4 weeks' };
  return { value: 0.0, reason: 'available much later' };
}

function scoreAmenitiesCluster(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): { value: number; reason: string } {
  const mustHaves = Array.isArray(tenant.must_haves) ? tenant.must_haves : [];
  const tenantFurnishing = tenant.furnishing ? String(tenant.furnishing).toLowerCase() : null;
  const wantsFurnished = tenantFurnishing === 'yes' || tenantFurnishing === 'fully_furnished' || tenantFurnishing === 'furnished'
    || mustHaves.some((m: any) => String(m).toLowerCase() === 'furnished');
  const propFurnished = isPropFurnished(property, allFeatures);

  const reasons: string[] = [];
  let totalChecks = 0;
  let matchedChecks = 0;

  if (wantsFurnished) {
    totalChecks++;
    if (propFurnished) { matchedChecks++; reasons.push('furnished'); }
    else { reasons.push('not furnished'); }
  }

  const nonFurnishedMustHaves = mustHaves
    .map((m: any) => String(m).toLowerCase())
    .filter((m: string) => m !== 'furnished');

  for (const term of nonFurnishedMustHaves) {
    totalChecks++;
    if (allFeatures.some(ff => ff.includes(term))) {
      matchedChecks++;
    } else {
      reasons.push(`missing: ${term}`);
    }
  }

  if (totalChecks === 0) return { value: 1.0, reason: 'no specific amenity requirements' };

  const value = matchedChecks / totalChecks;
  const matched = totalChecks - (totalChecks - matchedChecks);
  reasons.unshift(`${matched}/${totalChecks} amenities matched`);
  return { value, reason: reasons.join('; ') };
}

function scoreLifestyleCluster(
  tenant: TenantLike,
  property: PropertyLike,
  allFeatures: string[]
): { value: number; reason: string } {
  const reasons: string[] = [];
  let totalFactors = 0;
  let score = 0;

  const hasPets = tenant.has_pets === true;
  if (hasPets) {
    totalFactors++;
    const petPolicy = (property.pet_policy || property.pets || '').toString();
    if (!parsePetPolicy(petPolicy)) {
      score += 1;
      reasons.push('pets allowed');
    }
  }

  const needsParking = tenant.needs_parking === true || tenant.parking_needed === true;
  if (needsParking) {
    totalFactors++;
    const hasParking = !!property.parking_type || allFeatures.some(f => f.includes('parking') || f.includes('garage'));
    if (hasParking) { score += 1; reasons.push('parking available'); }
    else { reasons.push('no parking'); }
  }

  if (totalFactors === 0) return { value: 1.0, reason: 'no lifestyle constraints' };

  const value = score / totalFactors;
  return { value, reason: reasons.join('; ') || 'lifestyle OK' };
}

// ─── MAIN SCORING FUNCTION ──────────────────────────────────────────────────

/**
 * Weighted cluster-based property match score (0-100).
 * Deterministic — no LLM involvement.
 *
 * Clusters (weights): Budget (0.20), Layout (0.15), Location (0.35),
 * Timeline (0.10), Amenities (0.10), Lifestyle (0.10).
 *
 * Hard disqualifiers (score=0): wrong state, pets when not allowed,
 * deal-breaker present.
 * City mismatch is NOT a disqualifier — handled via tiered scoring in Location.
 */
export function scorePropertyMatch(tenant: TenantLike, property: PropertyLike): ScoringResult {
  const allFeatures = collectAllFeatures(property);

  const disqualifyReason = checkHardDisqualifiers(tenant, property, allFeatures);
  if (disqualifyReason) {
    return {
      score: 0,
      reason: disqualifyReason,
      disqualified: disqualifyReason,
      clusters: { budget: 0, layout: 0, location: 0, timeline: 0, amenities: 0, lifestyle: 0 },
    };
  }

  const budget = scoreBudgetCluster(tenant, property);
  const layout = scoreLayoutCluster(tenant, property);
  const location = scoreLocationCluster(tenant, property);
  const timeline = scoreTimelineCluster(tenant, property);
  const amenities = scoreAmenitiesCluster(tenant, property, allFeatures);
  const lifestyle = scoreLifestyleCluster(tenant, property, allFeatures);

  const clusters: ClusterBreakdown = {
    budget: Math.round(budget.value * 100),
    layout: Math.round(layout.value * 100),
    location: Math.round(location.value * 100),
    timeline: Math.round(timeline.value * 100),
    amenities: Math.round(amenities.value * 100),
    lifestyle: Math.round(lifestyle.value * 100),
  };

  const rawScore =
    budget.value   * CLUSTER_WEIGHTS.budget +
    layout.value   * CLUSTER_WEIGHTS.layout +
    location.value * CLUSTER_WEIGHTS.location +
    timeline.value * CLUSTER_WEIGHTS.timeline +
    amenities.value * CLUSTER_WEIGHTS.amenities +
    lifestyle.value * CLUSTER_WEIGHTS.lifestyle;

  const tier1Complete = (tenant.budget_max != null || tenant.budget != null)
    && tenant.bedrooms != null
    && (tenant.move_in_date != null);

  let finalScore = Math.round(rawScore * 100);
  const reasons: string[] = [];

  if (!tier1Complete) {
    finalScore = Math.min(finalScore, 70);
    reasons.push('incomplete Tier 1 data');
  }

  const clusterReasons = [budget, layout, location, timeline, amenities, lifestyle]
    .map(c => c.reason).filter(Boolean);
  reasons.push(...clusterReasons);

  finalScore = Math.max(0, Math.min(100, finalScore));

  return {
    score: finalScore,
    reason: reasons.join('; ') || 'good match',
    clusters,
    isNearby: location.isNearby,
  };
}

export interface RankedPropertyMatch {
  property: PropertyLike;
  score: number;
  reason: string;
  clusters?: ClusterBreakdown;
  isNearby?: boolean;
}

const MIN_SCORE = 45;
const INITIAL_RECOMMEND = 3;
const MAX_RECOMMEND = 5;

/**
 * Deterministic ranked property matches. Use this instead of AI propertyMatches.
 * @param maxResults - 3 for initial recommendation, 5 when client asks for more
 * @param alreadyShown - addresses already shown to client (skip them unless maxResults=5)
 */
export function getRankedPropertyMatches(
  tenant: TenantLike,
  properties: PropertyLike[],
  { maxResults = INITIAL_RECOMMEND, alreadyShown = [] }: { maxResults?: number; alreadyShown?: string[] } = {}
): RankedPropertyMatch[] {
  if (!properties?.length) return [];
  const tenantBeds = tenant.bedrooms ?? null;
  const results: RankedPropertyMatch[] = properties.map(p => {
    const { score, reason, clusters, isNearby } = scorePropertyMatch(tenant, p);
    return { property: p, score, reason, clusters, isNearby };
  });
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const eligible = sorted.filter(r => r.score > 0);
  const qualified = eligible.filter(r => r.score >= MIN_SCORE);
  const pool = qualified.length > 0 ? qualified : (
    eligible.length > 0
      ? eligible.slice(0, 3).map(r => ({ ...r, reason: r.reason + '; best available (low match)' }))
      : []
  );
  let candidates: RankedPropertyMatch[];
  if (alreadyShown.length > 0) {
    const seen = new Set(alreadyShown.map(a => a.toLowerCase()));
    const newOnes = pool.filter(r => !seen.has(r.property.address?.toLowerCase()));
    candidates = newOnes.length > 0 ? newOnes.slice(0, maxResults) : pool.slice(0, maxResults);
  } else {
    candidates = pool.slice(0, maxResults);
  }
  if (tenantBeds != null) {
    const hasMismatch = (r: RankedPropertyMatch) => (r.property.beds ?? r.property.bedrooms ?? 0) < tenantBeds;
    const good = candidates.filter(r => !hasMismatch(r));
    const mismatch = candidates.filter(r => hasMismatch(r));
    return [...good, ...mismatch].slice(0, maxResults);
  }
  return candidates;
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

export interface BrainResult {
  analysis: AiAnalysis;
}

/**
 * PHASE 1: THE BRAIN (lightweight)
 * Determines intent, extracts data, decides action.
 * Gets only property addresses + basic stats — NOT full descriptions.
 * Returns structured JSON only (no reply text).
 */
export async function analyzeBrain(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): Promise<BrainResult> {
  const { tenant, properties, conversationHistory } = context;
  const realtorName = context.realtorName || 'Agent';
  const timezone = context.timezone || 'America/Los_Angeles';
  const viewingStart = context.viewingHoursStart || '10:00';
  const viewingEnd = context.viewingHoursEnd || '20:00';

  // Minimal property list: address + price + beds + availability only
  const minimalPropertiesText = properties.map(p => {
    const price = p.price_monthly || p.price;
    const beds = p.beds ?? p.bedrooms;
    return `- ${p.address}: $${price || '?'}/mo, ${beds ?? '?'}bd, pets=${p.pet_policy || 'unknown'}, available=${p.available_from || 'now'}`;
  }).join('\n');

  const historyText = conversationHistory.map(m =>
    `${m.role === 'user' ? 'Client' : 'Agent'}: ${m.content}`
  ).join('\n');

  const hasAgentMessages = conversationHistory.some(m => m.role === 'assistant');
  const isFirstMessage = !hasAgentMessages;

  const now = new Date();
  const currentDateContext = `${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;

  const executionNote = executionResult?.success
    ? `\nCALENDAR BOOKING SUCCEEDED: link=${executionResult.data?.htmlLink}, time=${executionResult.data?.start?.dateTime}`
    : executionResult?.error
      ? `\nCALENDAR BOOKING FAILED: ${executionResult.error}`
      : '';

  const preRankedSection = context.preRankedMatches && context.preRankedMatches.length > 0
    ? `\nPRE-RANKED MATCHES (properties the system selected for this client, in order):
${context.preRankedMatches.map((m, i) => `Option ${i + 1}: ${m.address} — score ${m.score}/100 — $${m.price}/mo, ${m.beds ?? '?'}bd/${m.baths ?? '?'}ba (${m.reason})`).join('\n')}

RULES FOR PHOTO REQUESTS:
- "the option"/"that option" with only ONE previously shown → assume that property.
- "option 1"/"first option"/"the first one" → Option 1 address above.
- "option 2"/"second option"/"the second one" → Option 2 address above.
- "option 3"/"third option"/"the third one" → Option 3 address above.
- For photo requests: set action="send_listing", listing_addresses=[address], photo_mode=true.
- Only ask for clarification if 2+ properties shown AND genuinely ambiguous.
RULE: When recommending, use ONLY properties from the PRE-RANKED MATCHES list above, in order.
`
    : '';

  const prompt = `You are a real estate leasing AI assistant's BRAIN module.
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
${minimalPropertiesText || 'No properties available.'}
${preRankedSection}
CONTEXT:
REALTOR_NAME: ${realtorName}
Client: ${tenant.name} (${tenant.email || 'unknown'})
CURRENT DATE/TIME: ${currentDateContext}
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

  const parseBrainResponse = (text: string): BrainResult => {
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    const parsed = JSON.parse(cleanText);
    // Strip reply if AI included one anyway
    const { reply: _discard, ...analysisFields } = parsed;
    return { analysis: analysisFields as AiAnalysis };
  };

  // Attempt 1
  try {
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
    const recentHistory = conversationHistory.slice(-6);
    const compactHistoryText = recentHistory.map(m =>
      `${m.role === 'user' ? 'Client' : 'Agent'}: ${m.content}`
    ).join('\n');

    const compactPrompt = `You are a real estate AI brain. Analyze the client message and return structured JSON (no reply text).

PROPERTIES: ${minimalPropertiesText || 'None'}
${preRankedSection}
Client: ${tenant.name} | Date: ${new Date().toLocaleDateString('en-US')}
IS_FIRST_MESSAGE: ${isFirstMessage}
${executionNote}

CONVERSATION:
${compactHistoryText}

Return JSON: {"action":"reply","intent":"general","listing_addresses":[],"photo_mode":false,"extractedData":{},"summary":{"client":"","interests":"","concerns":"","next_step":""},"priority":"warm","pending_checks":[],"thought_process":"..."}`;

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

export interface CombinedResult {
  analysis: AiAnalysis;
  reply: string;
}

/**
 * @deprecated Use analyzeBrain() + generateFinalResponse() instead.
 * Thin wrapper kept for backward compatibility — delegates to the two-phase pipeline.
 */
export async function analyzeAndRespond(
  context: ConversationContext,
  executionResult?: { success: boolean; data?: any; error?: string }
): Promise<CombinedResult> {
  console.warn('⚠️ analyzeAndRespond is deprecated — use analyzeBrain() + generateFinalResponse() instead');
  const { analysis } = await analyzeBrain(context, executionResult);
  const reply = await generateFinalResponse(context, analysis, executionResult);
  return { analysis, reply };
}
