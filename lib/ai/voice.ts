import { geminiModel, generateContentWithRetry } from '@/lib/gemini-client';
import { QUALIFICATION_SYSTEM_PROMPT } from '@/lib/ai/models';
import type { ConversationContext, AiAnalysis, Property } from '@/lib/ai/types';

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
      const errMsg = executionResult?.error || '';
      const isNoOAuth = errMsg.includes('no OAuth') || errMsg.includes('not connected');
      instructions = isNoOAuth
        ? `
        ACTION RESULT: Calendar is not connected yet.
        TASK: Let the client know you'd love to book the viewing, but the scheduling system is being set up. Ask them to confirm their preferred date and time so the agent can finalize it manually. Do NOT say "something went wrong".
        `
        : `
        ACTION RESULT: Booking failed.
        Error: ${errMsg}
        
        TASK: Apologize briefly for the technical issue and ask the client to suggest a date and time so you can try again. Do NOT say "another" time — the client may not have proposed one yet.
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
