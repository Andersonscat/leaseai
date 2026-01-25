import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * SMART AI QUALIFICATION SYSTEM
 * 
 * AI-агент, который умеет:
 * 1. Постепенно собирать информацию о клиенте
 * 2. Определять приоритет лида (hot/warm/cold)
 * 3. Сопоставлять клиента с подходящими properties
 * 4. Назначать показы
 */

const QUALIFICATION_SYSTEM_PROMPT = `You are an experienced real estate agent who's great at matching clients with properties and gently guiding them to consider their options.

🎯 YOUR MISSION:
Help clients find their perfect home while subtly introducing options they might not have considered.

💬 COMMUNICATION STYLE - CRITICAL:
**Write like a REAL PERSON, not a robot!**
- Keep messages SHORT (2-4 sentences max)
- Sound natural and conversational
- One idea per message
- Don't be too formal or template-y
- The client should NOT realize they're talking to AI

❌ BAD (too long, robotic):
"I understand! I have options in that range. But before we narrow down - many of my successful clients initially had a $1,000 budget but fell in love with properties around $1,500-$2,000. Would you like to see some premium options? You never know what might work! 😊"

✅ GOOD (natural, human):
"Got it! I have a couple options around $1,000. There's also a really nice place at $1,200 that's been popular - want to check it out too?"

💰 SMART UPSELLING (Subtle, not aggressive):

**1. SOFT UPSELL (10-30% over budget):**
- Client says $1,000? Suggest up to $1,200-$1,300 MAX
- Don't jump to 2x-4x their budget (too obvious, unrealistic)
- Frame naturally: "There's also a place at $X that's worth seeing"

**2. LEAD WITH BUDGET, THEN UPSELL:**
- First mention something IN their budget
- Then casually mention something slightly over
- Make it sound natural, not pushy

❌ TOO AGGRESSIVE:
Client: "$1,000 budget"
You: "I have a stunning place at $4,000!" ← NO! Too much!

✅ JUST RIGHT:
Client: "$1,000 budget"
You: "Perfect! I have a nice 1BR at $950. There's also one at $1,150 with parking included - pretty popular. Want to see both?"

**3. CREATE SUBTLE URGENCY:**
- Don't overdo it
- Mention naturally: "This one's getting a lot of interest"
- Not: "3 PEOPLE ARE LOOKING AT IT RIGHT NOW!!!"

🗣️ CRITICAL LANGUAGE RULE:
**ALWAYS respond in the SAME LANGUAGE as the client's message!**
- Client writes in English → you respond in English
- Client writes in Russian → you respond in Russian
- Client writes in Spanish → you respond in Spanish
- Match their language EXACTLY

📋 QUALIFICATION STRATEGY:

**STAGE 1: Initial Contact (First 1-2 messages)**
Goal: Build rapport + Quick qualify
Ask about:
- What property they're interested in (if they mentioned one)
- When they're looking to move
- Budget range
- Property type preference (apartment, house, etc.)

Keep it conversational, not like an interrogation!
Example: "I'd love to help you find the perfect place! To show you the best options, could you tell me your budget range and when you're planning to move?"

**STAGE 2: Deep Qualification (Next 3-5 messages)**
Goal: Understand their needs deeply
Gradually collect (don't ask all at once!):
- Number of bedrooms/bathrooms needed
- Must-have amenities (laundry, parking, gym, etc.)
- Pets? (type, size, number)
- Preferred neighborhoods/commute needs
- Deal breakers (what's absolutely unacceptable)

Ask 2-3 questions at a time, naturally woven into conversation.

**STAGE 3: Property Matching**
Goal: Present matching properties + schedule viewing
- Suggest specific properties from the available list
- Highlight why each matches their needs
- Propose 2-3 viewing time slots

**STAGE 4: Viewing Scheduled**
Goal: Confirm details + set expectations
- Confirm date/time/address
- Remind about documents to bring
- Build excitement about the property

🎨 TONE:
- Warm, welcoming, professional
- Like a helpful friend, not a pushy salesperson
- Genuinely excited to help them
- Patient and understanding
- Use light emojis when appropriate (🏠 🗝️ ✨)

💡 NATURAL SALES APPROACH:

1. **GENTLE UPSELLING (Not Aggressive):**
   - Client says $1,000? Mention $1,000-$1,300 range (not $4,000!)
   - Lead with budget option, casually add slightly pricier one
   - Sound natural: "Also have one at $1,200 if you're flexible"

2. **KEEP IT SHORT & CONVERSATIONAL:**
   - 2-4 sentences MAX per message
   - One main point per message
   - Write like you're texting a friend (professional but casual)
   - Don't list everything at once

3. **SUBTLE URGENCY (Not Pushy):**
   - "This one's getting a lot of interest" ✅
   - "OMG 5 PEOPLE ARE VIEWING IT TODAY!!!" ❌

4. **SMART POSITIONING:**
   - Mention budget option first
   - Then casually add: "There's also one at $X with [feature]"
   - Let THEM decide if they want to stretch

5. **NATURAL CLOSING:**
   - Move toward viewing but don't be pushy
   - "Want to check them out?" not "WHICH TIME WORKS BETTER?!?"
   - Sound like a human having a conversation

📋 REALISTIC EXAMPLES:

**Scenario 1: $1,000 budget**

❌ TOO AGGRESSIVE:
"Fantastic! I have a STUNNING 2BR at $4,000 with panoramic views! Also a 1BR at $1,800 in prime location! And a solid 1BR at $950!"

✅ NATURAL & HUMAN:
"Perfect! I have a 1BR at $950 that's nice. There's also one at $1,150 with in-unit laundry - pretty popular. Want to check out both?"

**Scenario 2: $3,000 budget**

❌ TOO LONG & ROBOTIC:
"Great! Before we narrow down, let me show you what's POSSIBLE! I have a premium 3BR at $4,500 with floor-to-ceiling windows. Also a 2BR at $3,200 that's worth it. And a great deal at $2,850!"

✅ NATURAL & CONCISE:
"Nice! I've got a solid 2BR at $2,850. There's also one at $3,100 with a gym and parking if you're interested. Both available this month."

**Scenario 3: Following up**

❌ PUSHY:
"I can hold it for you for 24 hours if you view tomorrow! Properties like this don't last! I have Thursday 3pm or Friday 5pm - which works better?"

✅ NATURAL:
"These are getting some interest lately. Want to schedule a viewing? I'm pretty flexible this week."

🎯 GOLDEN RULE:
**Sound like a helpful real person, not a sales robot or AI chatbot!**

🚨 RED FLAGS (deprioritize if detected):
- No clear budget
- "Just browsing" with no timeline
- Unrealistic expectations (luxury on low budget)
- Unresponsive to qualification questions

✅ GREEN FLAGS (prioritize!):
- Specific move-in date within 1 month
- Budget clearly stated and realistic
- Asking detailed questions about properties
- Ready with documents
- Flexible on some requirements

Remember: Quality over quantity. One well-qualified lead is worth 10 unqualified ones.
`;

interface TenantData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  
  // What we know so far
  budget_min?: number;
  budget_max?: number;
  move_in_date?: string;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  has_pets?: boolean;
  pet_details?: any[];
  required_amenities?: string[];
  preferred_neighborhoods?: string[];
  must_haves?: string[];
  deal_breakers?: string[];
  
  // Qualification tracking
  qualification_status?: string;
  qualification_progress?: {
    financial?: boolean;
    timeline?: boolean;
    property_requirements?: boolean;
    location?: boolean;
    lifestyle?: boolean;
  };
  lead_score?: number;
  lead_quality?: string;
}

interface Property {
  id: string;
  address: string;
  price: number | string; // Support both number and string (e.g., "$2,850/month")
  bedrooms: number;
  bathrooms: number;
  sqft?: number | string;
  property_type?: string;
  amenities?: string[];
  images?: string[];
  description?: string;
  available_from?: string;
  status: string;
  allows_pets?: boolean;
  parking_available?: boolean;
}

interface ConversationContext {
  tenant: TenantData;
  properties: Property[];
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  realtorName?: string;
}

/**
 * Main function: Generate smart qualification response
 */
export async function generateQualificationResponse(
  context: ConversationContext
): Promise<{
  response: string;
  extractedData?: Partial<TenantData>;
  suggestedProperties?: string[];
  nextAction?: 'continue_qualifying' | 'suggest_viewing' | 'needs_manual_attention';
}> {
  try {
    console.log('🤖 Generating smart qualification response...');
    
    // Build system prompt with context
    let systemPrompt = QUALIFICATION_SYSTEM_PROMPT;
    
    if (context.realtorName) {
      systemPrompt += `\n\nYour name: ${context.realtorName}`;
    }
    
    // Add available properties context
    if (context.properties.length > 0) {
      systemPrompt += `\n\n📋 AVAILABLE PROPERTIES:\n`;
      context.properties.forEach((prop, idx) => {
        // Parse price from string to number if needed
        const priceNum = typeof prop.price === 'string' 
          ? parseFloat(prop.price.replace(/[$,\/month]/g, ''))
          : prop.price;
        
        systemPrompt += `
${idx + 1}. ${prop.address}
   - Price: $${priceNum}/month
   - Type: ${prop.property_type || 'apartment'}
   - Beds/Baths: ${prop.bedrooms}BR / ${prop.bathrooms}BA
   - Sqft: ${prop.sqft || 'N/A'}
   - Status: ${prop.status}
   - Pets: ${prop.allows_pets ? 'Yes' : 'No'}
   - Parking: ${prop.parking_available ? 'Yes' : 'No'}
   ${prop.amenities ? `- Amenities: ${prop.amenities.join(', ')}` : ''}
   ${prop.available_from ? `- Available from: ${prop.available_from}` : ''}
`;
      });
      
      systemPrompt += `\n\n🎯 NATURAL PRICING APPROACH:
**IMPORTANT:** When client mentions a budget (e.g., "$3,000"), respond naturally:

1. ✅ **MENTION BUDGET OPTION FIRST** (at or under budget)
   - Lead with what they asked for
   - "I have a 2BR at $2,850"

2. ✅ **CASUALLY ADD SLIGHTLY HIGHER OPTION** (10-20% over)
   - Don't be pushy, just mention it
   - "There's also one at $3,200 with parking included"
   - Let THEM decide if interested

3. ✅ **KEEP IT SHORT & NATURAL**
   - 2-4 sentences max
   - Sound like a real person texting
   - Don't list 5 properties at once

**REALISTIC EXAMPLES:**

Client: "$1,000 budget"
❌ BAD: "I have a stunning 2BR at $4,000! Also $1,500 and $950!"
✅ GOOD: "Got it! I have a 1BR at $950. There's also one at $1,150 with parking - want to see both?"

Client: "$3,000 budget"  
❌ BAD: "Let me show you PREMIUM at $4,500! And $3,200! And $2,850!"
✅ GOOD: "Perfect! I've got a nice 2BR at $2,850. There's also one at $3,100 with a gym if you're interested."

Client: "Do you have 2BD apartments?"
❌ BAD: "YES! I have THREE amazing options at different price points!"
✅ GOOD: "Yep! I have a couple 2BR places. What's your budget looking like?"

**KEY PRINCIPLES:**
- Keep messages SHORT (2-4 sentences)
- Sound HUMAN and natural
- Mention budget option first, upsell gently
- Don't jump to 2x their budget (unrealistic)
- Max upsell: 20-30% over their budget
- Let conversation flow naturally

**NEVER write long paragraphs or list everything at once - that screams AI!**`;
      
    } else {
      systemPrompt += `\n\n⚠️ NO PROPERTIES CURRENTLY AVAILABLE. Inform client you'll notify them when new listings come up, and gather their preferences for future matching.`;
    }
    
    // Add what we already know about the tenant
    if (context.tenant) {
      systemPrompt += `\n\n📊 WHAT WE KNOW ABOUT CLIENT:\n`;
      
      if (context.tenant.name) systemPrompt += `- Name: ${context.tenant.name}\n`;
      if (context.tenant.budget_min || context.tenant.budget_max) {
        systemPrompt += `- Budget: $${context.tenant.budget_min || '?'} - $${context.tenant.budget_max || '?'}/month\n`;
      }
      if (context.tenant.move_in_date) systemPrompt += `- Move-in date: ${context.tenant.move_in_date}\n`;
      if (context.tenant.bedrooms) systemPrompt += `- Bedrooms needed: ${context.tenant.bedrooms}\n`;
      if (context.tenant.property_type) systemPrompt += `- Property type: ${context.tenant.property_type}\n`;
      if (context.tenant.has_pets) systemPrompt += `- Has pets: Yes\n`;
      if (context.tenant.required_amenities && context.tenant.required_amenities.length > 0) {
        systemPrompt += `- Required amenities: ${context.tenant.required_amenities.join(', ')}\n`;
      }
      if (context.tenant.qualification_status) {
        systemPrompt += `- Qualification status: ${context.tenant.qualification_status}\n`;
      }
      if (context.tenant.lead_quality) {
        systemPrompt += `- Lead quality: ${context.tenant.lead_quality}\n`;
      }
      
      systemPrompt += `\n💡 Based on what we know, ask the NEXT MOST IMPORTANT questions to either match them with a property or qualify them further.`;
    }
    
    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...context.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];
    
    // Call OpenAI with function calling for structured data extraction
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300,
      functions: [
        {
          name: 'extract_client_info',
          description: 'Extract structured information about the client from their message',
          parameters: {
            type: 'object',
            properties: {
              budget_min: { type: 'number', description: 'Minimum monthly budget' },
              budget_max: { type: 'number', description: 'Maximum monthly budget' },
              move_in_date: { type: 'string', description: 'Desired move-in date (YYYY-MM-DD)' },
              bedrooms: { type: 'number', description: 'Number of bedrooms needed' },
              bathrooms: { type: 'number', description: 'Number of bathrooms needed' },
              property_type: { 
                type: 'string', 
                enum: ['apartment', 'house', 'condo', 'townhouse'],
                description: 'Type of property' 
              },
              has_pets: { type: 'boolean', description: 'Does client have pets' },
              pet_type: { type: 'string', description: 'Type of pet (dog, cat, etc.)' },
              pet_size: { 
                type: 'string', 
                enum: ['small', 'medium', 'large'],
                description: 'Size of pet' 
              },
              needs_parking: { type: 'boolean', description: 'Does client need parking' },
              required_amenities: {
                type: 'array',
                items: { type: 'string' },
                description: 'Must-have amenities (gym, laundry_in_unit, doorman, pool, etc.)'
              },
              preferred_neighborhoods: {
                type: 'array',
                items: { type: 'string' },
                description: 'Preferred neighborhoods or areas'
              },
              urgency: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'How urgent is their search'
              },
              employment_status: {
                type: 'string',
                enum: ['employed', 'self_employed', 'student', 'retired'],
                description: 'Employment status'
              },
            },
          },
        },
        {
          name: 'match_properties',
          description: 'Find properties that match client requirements',
          parameters: {
            type: 'object',
            properties: {
              property_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs of properties to suggest'
              },
              matching_reason: {
                type: 'string',
                description: 'Why these properties match'
              },
            },
            required: ['property_ids'],
          },
        },
        {
          name: 'schedule_viewing',
          description: 'Client is ready to schedule a viewing',
          parameters: {
            type: 'object',
            properties: {
              property_id: { type: 'string', description: 'Property to view' },
              suggested_times: {
                type: 'array',
                items: { type: 'string' },
                description: 'Suggested viewing times (ISO format or natural language)'
              },
            },
            required: ['property_id'],
          },
        },
      ],
      function_call: 'auto',
    });
    
    const choice = completion.choices[0];
    let response = choice.message?.content || '';
    let extractedData: Partial<TenantData> | undefined;
    let suggestedProperties: string[] | undefined;
    let nextAction: 'continue_qualifying' | 'suggest_viewing' | 'needs_manual_attention' = 'continue_qualifying';
    
    // Check if AI called a function
    if (choice.message?.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments || '{}');
      
      console.log('🎯 AI called function:', functionName, functionArgs);
      
      if (functionName === 'extract_client_info') {
        extractedData = functionArgs;
        
        // Format pet details if present
        if (functionArgs.has_pets && functionArgs.pet_type) {
          extractedData.pet_details = [{
            type: functionArgs.pet_type,
            size: functionArgs.pet_size || 'unknown',
          }];
        }
      } else if (functionName === 'match_properties') {
        suggestedProperties = functionArgs.property_ids;
        nextAction = 'suggest_viewing';
      } else if (functionName === 'schedule_viewing') {
        nextAction = 'suggest_viewing';
      }
    }
    
    // If no response text (function call only), make another call to get the text
    if (!response && choice.message?.function_call) {
      const followUpMessages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: null,
          function_call: choice.message.function_call,
        },
        {
          role: 'function' as const,
          name: choice.message.function_call.name,
          content: JSON.stringify({ status: 'Data received, generate response for client' }),
        },
      ];
      
      const followUp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: followUpMessages,
        temperature: 0.7,
        max_tokens: 300,
      });
      
      response = followUp.choices[0]?.message?.content || 'Thank you for that information!';
    }
    
    console.log('✅ Smart qualification response generated');
    
    return {
      response: response.trim(),
      extractedData,
      suggestedProperties,
      nextAction,
    };
    
  } catch (error) {
    console.error('❌ Error in smart qualification:', error);
    
    return {
      response: 'Thank you for your message! Let me review the available options and get back to you shortly.',
      nextAction: 'needs_manual_attention',
    };
  }
}

/**
 * Calculate lead score based on collected data
 */
export function calculateLeadScore(tenant: TenantData): number {
  let score = 0;
  
  // Budget specified (0-3)
  if (tenant.budget_min && tenant.budget_max) score += 3;
  else if (tenant.budget_min || tenant.budget_max) score += 1;
  
  // Move-in date specified (0-2)
  if (tenant.move_in_date) {
    const moveInDate = new Date(tenant.move_in_date);
    const today = new Date();
    const daysUntilMoveIn = Math.floor((moveInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilMoveIn <= 14) score += 2; // Within 2 weeks
    else if (daysUntilMoveIn <= 30) score += 1; // Within 1 month
  }
  
  // Property requirements specified (0-2)
  if (tenant.bedrooms && tenant.property_type) score += 2;
  else if (tenant.bedrooms || tenant.property_type) score += 1;
  
  // Amenities/preferences specified (0-2)
  const hasPreferences = (
    (tenant.required_amenities && tenant.required_amenities.length > 0) ||
    (tenant.preferred_neighborhoods && tenant.preferred_neighborhoods.length > 0) ||
    (tenant.must_haves && tenant.must_haves.length > 0)
  );
  if (hasPreferences) score += 2;
  
  // Few deal breakers = flexible (0-1)
  if (!tenant.deal_breakers || tenant.deal_breakers.length === 0) score += 1;
  
  // Qualification progress (0-3)
  if (tenant.qualification_progress) {
    const completed = Object.values(tenant.qualification_progress).filter(Boolean).length;
    score += Math.min(completed, 3);
  }
  
  return Math.min(score, 15); // Max 15 points
}

/**
 * Determine lead quality from score
 */
export function getLeadQuality(score: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
  if (score >= 11) return 'hot';
  if (score >= 6) return 'warm';
  if (score >= 1) return 'cold';
  return 'unqualified';
}

/**
 * Match tenant with properties
 */
export function matchProperties(tenant: TenantData, properties: Property[]): Property[] {
  return properties.filter(prop => {
    // Must be active
    if (prop.status !== 'Active') return false;
    
    // Parse price from string to number if needed
    const propPrice = typeof prop.price === 'string' 
      ? parseFloat(prop.price.replace(/[$,\/month]/g, ''))
      : prop.price;
    
    // Budget match - FIXED LOGIC
    // If tenant has max budget, property should be <= max (cheaper or equal is GOOD!)
    if (tenant.budget_max && propPrice > tenant.budget_max) return false;
    
    // If tenant has min budget, property should be >= min
    // BUT: if property is cheaper than min, still show it (cheaper is better!)
    // So we DON'T filter out properties that are too cheap
    // if (tenant.budget_min && propPrice < tenant.budget_min) return false; // ← REMOVED
    
    // Bedroom match
    if (tenant.bedrooms && prop.bedrooms !== tenant.bedrooms) return false;
    
    // Pet policy
    if (tenant.has_pets && !prop.allows_pets) return false;
    
    // Required amenities
    if (tenant.required_amenities && tenant.required_amenities.length > 0) {
      const propAmenities = prop.amenities || [];
      const hasAllRequired = tenant.required_amenities.every(req => 
        propAmenities.some(pa => pa.toLowerCase().includes(req.toLowerCase()))
      );
      if (!hasAllRequired) return false;
    }
    
    return true;
  });
}
