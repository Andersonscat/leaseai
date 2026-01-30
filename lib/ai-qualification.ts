import { SchemaType } from '@google/generative-ai';
import { geminiModel, generateContentWithRetry } from '@/lib/gemini-client';

// Force rebuild timestamp: 2026-01-28
/**
 * SMART AI QUALIFICATION SYSTEM
 * 
 * AI-агент, который умеет:
 * 1. Постепенно собирать информацию о клиенте
 * 2. Определять приоритет лида (hot/warm/cold)
 * 3. Сопоставлять клиента с подходящими properties
 * 4. Назначать показы (через Function Calling)
 */

const QUALIFICATION_SYSTEM_PROMPT = `You are an experienced real estate agent who's great at matching clients with properties and gently guiding them to consider their options.

🎯 YOUR MISSION:
Help clients find their perfect home while subtly introducing options they might not have considered.

💬 COMMUNICATION STYLE - CRITICAL:
**You are a friendly, high-energy, and professional Real Estate Agent (not a support bot).**

RESPONSE STRUCTURE:
1. **Greeting**: Always start with a warm greeting using the client's name (e.g., "Hi John!", "Good afternoon Sarah!").
2. **Acknowledgement**: Enthusiastically acknowledge their message (e.g., "Sure thing!", "I'd love to help you with that!", "That sounds perfect!").
3. **Content**: Clear, concise, and helpful information.
4. **Action**: End with a clear next step or question.

❌ BAD (Robotic/Dry):
"I understand. I have options in that range. What is your move-in date?"

✅ GOOD (Friendly & Structured):
"Hi John! 👋
That sounds like a great plan! I definitely have some amazing 2BD options in Seattle around $3,000.
To narrow it down to the absolute best matches, could you tell me your preferred move-in date? excited to get this started!"

💰 SMART UPSELLING (Subtle):

💰 SMART UPSELLING (Subtle, not aggressive):
**1. SOFT UPSELL (10-30% over budget):**
- Client says $1,000? Suggest up to $1,200-$1,300 MAX
- Don't jump to 2x-4x their budget
- Frame naturally: "There's also a place at $X that's worth seeing"

**2. LEAD WITH BUDGET, THEN UPSELL:**
- First mention something IN their budget
- Then casually mention something slightly over

**3. CREATE SUBTLE URGENCY:**
- Mention naturally: "This one's getting a lot of interest"

🗣️ CRITICAL LANGUAGE RULE:
**ALWAYS respond in the SAME LANGUAGE as the client's message!**
- Client writes in English → you respond in English
- Client writes in Russian → you respond in Russian
- Match their language EXACTLY

📋 QUALIFICATION STRATEGY:
**STAGE 1: Initial Contact**
Goal: Build rapport + Quick qualify (budget, move date)
Ask about: Budget, move-in date, property preference.

**STAGE 2: Deep Qualification**
Goal: Understand needs (bedrooms, pets, amenities)
Ask 2-3 questions at a time.

**STAGE 3: Property Matching**
Goal: Present matching properties + schedule viewing

**STAGE 4: Viewing Scheduled**
Goal: Confirm details + set expectations

TOOLS AVAILABLE:
You have access to a tool called 'book_calendar_event'.
USE IT WHEN THE CLIENT CONFIRMS A TIME.
Example: Client says "3pm works" -> You CALL the function.
Do NOT say "I will book it" without calling the function.

🛡️ DEAL BREAKER CHECKS (CRITICAL):
Before suggesting a property, CHECK:
1. **Availability**: If Client wants to move in BEFORE the 'Available From' date, warn them! (e.g. "This unit is available starting March 1st, so Feb 15th might be too early. Would that work?")
2. **Pets**: If Client has a dog and policy is 'No Pets', DO NOT suggest it unless they ask. If 'Small Dogs Only' and they have a Great Dane, flag it.
3. **Parking**: If they need parking, check 'parking_type'. Don't promise a garage if it is 'street' only.

💰 FINANCIAL TRANSPARENCY:
If asked about costs, quote the specific 'Application Fee' and 'Security Deposit' from the property data.
`;

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
  qualification_status?: 'new' | 'qualifying' | 'qualified' | 'disqualified';
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
  }
}): Promise<{ response: string }> {
  const prompt = `You called the book_calendar_event function and here's what happened:

${context.functionResult.success ? `✅ SUCCESS! Calendar event created.
📅 Event Link: ${context.functionResult.calendar_link}
⏰ Time: ${context.functionResult.event_time}

Now generate a friendly confirmation message to the client that includes the calendar link. Make it natural and professional!` : `❌ ERROR: ${context.functionResult.error}

The calendar booking failed. Generate a polite apology and ask the client to confirm the time again.`}

Generate ONLY the response text, no JSON, no extra formatting.`;

  const result = await generateContentWithRetry(geminiModel, prompt);
  const responseText = result.response.text();
  
  return { response: responseText };
}

// NEW: Strict Schemas for Analysis Phase
export interface AiAnalysis {
  thought_process: string;
  intent: 'booking_confirmed' | 'inquiry' | 'general';
  action: 'book_calendar' | 'reply'; // Strict action decision
  action_params?: {
    start_time: string;
    property_address: string;
    client_name?: string;
    duration_minutes?: number;
  };
  extractedData?: Partial<TenantData>;
  suggestedProperties?: string[];
}

/**
 * PHASE 1: THE BRAIN
 * Analyze the conversation and decide on an ACTION.
 * Output is STRICT JSON. No text generation yet.
 */
export async function analyzeConversation(context: ConversationContext): Promise<AiAnalysis> {
  console.log('🧠 AI Brain: Analyzing conversation...');
  const { tenant, properties, conversationHistory } = context;

  const propertiesText = properties.map(p => 
    `- ${p.address}:
       Price: ${p.price}
       Beds: ${p.bedrooms}
       Status: ${p.status}
       Available: ${p.available_from || 'Now'}
       Pets: ${p.pet_policy || 'Unknown'}
       Parking: ${p.parking_type || 'Unknown'} (${p.parking_fee ? '$'+p.parking_fee : 'included'})
       Utilities: ${p.utilities_included?.join(', ') || 'Tenant pays'}
       Fees: App $${p.application_fee || '0'}, Deposit $${p.security_deposit || '0'}`
  ).join('\n\n');

  const historyText = conversationHistory.map(m => 
    `${m.role === 'user' ? 'Client' : 'You'}: ${m.content}`
  ).join('\n');

  const analysisPrompt = `
${QUALIFICATION_SYSTEM_PROMPT}

CONTEXT:
Client: ${tenant.name} (${tenant.email})
Properties:
${propertiesText}

HISTORY:
${historyText}

TASK:
1. Analyze the client's latest message.
2. Decide on the immediate NEXT ACTION.
3. If the client CONFIRMED a specific time for a viewing (e.g. "3pm works"), your action MUST be 'book_calendar'.
4. Return ONLY valid JSON matching this structure:

{
  "thought_process": "Client wants to meet at 3pm...",
  "intent": "booking_confirmed" | "inquiry" | "general",
  "action": "book_calendar" | "reply",
  "action_params": {
     "start_time": "YYYY-MM-DDTHH:mm:ss" (ONLY if action is book_calendar),
     "property_address": "..." (ONLY if action is book_calendar),
     "duration_minutes": 30
  },
  "extractedData": { "budget": "...", "requirements": "..." },
  "suggestedProperties": ["..."]
}
`;

  try {
    const result = await generateContentWithRetry(geminiModel, analysisPrompt);
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
    // Fallback safe analysis
    return {
      thought_process: "Error analyzing, falling back to simple reply",
      intent: 'general',
      action: 'reply',
      extractedData: {}
    };
  }
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
      ACTION RESULT: ✅ Booking Successful!
      Link: ${executionResult.data.htmlLink}
      Time: ${executionResult.data.start.dateTime}
      
      TASK: Write a friendly confirmation email. INCLUDE THE LINK.
      `;
    } else {
      instructions = `
      ACTION RESULT: ❌ Booking Failed.
      Error: ${executionResult?.error}
      
      TASK: Apologize and ask to try a different time or manual confirmation.
      `;
    }
  } else {
    instructions = `
    TASK: Write a helpful response based on your analysis.
    Focus on: ${analysis.thought_process}
    `;
  }

  const prompt = `
${QUALIFICATION_SYSTEM_PROMPT}

CONTEXT:
Client: ${context.tenant.name}
History: ... (omitted for brevity, assume continuity)

${instructions}

Generate ONLY the email body text. No JSON.
`;

  const result = await generateContentWithRetry(geminiModel, prompt);
  return result.response.text();
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
