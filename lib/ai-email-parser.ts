// AI-Powered Email Parser using Gemini
// This intelligently extracts lead information from any email

import { geminiModel } from '@/lib/gemini-client';

const model = geminiModel;

export interface AIParserResult {
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string;
  message: string;          // AI summary for internal use (lead scoring, analysis)
  original_message?: string; // Original verbatim email body shown in inbox
  source: string; 
  property_address?: string;
  intent?: 'viewing' | 'inquiry' | 'booking' | 'question';
  urgency?: 'high' | 'medium' | 'low';
  budget?: string;
  move_in_date?: string;
  isLead: boolean;        
  confidence: number;      
  reason: string;          
  messageId?: string;     // Gmail specific
  rfcMessageId?: string;  // Gmail specific
  threadId?: string;      // Gmail specific
  subject?: string;       // Gmail specific
}

/**
 * AI-powered email parsing with Gemini 2.0 Flash
 */
export async function parseEmailWithAI(
  from: string,
  subject: string,
  body: string
): Promise<AIParserResult | null> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GOOGLE_GEMINI_API_KEY not set, falling back to regex parsing');
      return null;
    }
    
    const prompt = `You are an expert real estate lead parser. Extract structured information from this email.

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body.substring(0, 2000)} ${body.length > 2000 ? '...' : ''}

Extract the following information:
1. tenant_name: Full name of the person inquiring
2. tenant_email: Their email address
3. tenant_phone: Phone number if mentioned (format: +1-XXX-XXX-XXXX)
4. original_message: The client's NEW message only. Strip any quoted reply text (lines starting with >, "On ... wrote:", forwarded content, signatures). Copy the actual new content VERBATIM.
5. message: A short internal summary for CRM (1-2 sentences)
6. source: Which platform (zillow, airbnb, facebook, craigslist, email, other)
7. property_address: Address of the property they're interested in
8. intent: What they want (viewing, inquiry, booking, question)
9. urgency: high (needs ASAP), medium (within week), low (just browsing)
10. budget: Their budget if mentioned (e.g. "$2000/month", "$500k")
11. move_in_date: When they want to move in if mentioned

Return ONLY valid JSON. If information is not found, use null.

Example output:
{
  "tenant_name": "John Smith",
  "tenant_email": "john@example.com",
  "tenant_phone": "+1-555-123-4567",
  "original_message": "Hi, I saw your listing on Zillow for the 2BR apartment on Main St. I'm very interested and would love to schedule a viewing this weekend if possible. My budget is around $2500/month and I'm looking to move in by May 1st. Thanks!",
  "message": "Interested in 2BR on Main St, wants viewing this weekend, budget $2500.",
  "source": "zillow",
  "property_address": "123 Main St, San Francisco, CA",
  "intent": "viewing",
  "urgency": "high",
  "budget": "$2500/month",
  "move_in_date": "May 1, 2026"
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();

    if (!responseText) {
      console.error('No content from Gemini');
      return null;
    }

    // Parse JSON response
    let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Sometimes Gemini adds extra text, try to find JSON block
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    let parsed: AIParserResult;

    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', e);
      return null;
    }
    
    // Validate required fields
    if (!parsed.tenant_name || (!parsed.tenant_email && !parsed.tenant_phone) || !parsed.message) {
      console.error('Missing required fields from AI parsing');
      return null;
    }

    // Ensure we have an email - if missing but extracted from 'from', force it
    if (!parsed.tenant_email) {
       const emailMatch = from.match(/[\w.-]+@[\w.-]+\.\w+/);
       if (emailMatch) parsed.tenant_email = emailMatch[0];
    }

    console.log('✅ AI parsed email:', {
      name: parsed.tenant_name,
      source: parsed.source,
      intent: parsed.intent,
    });

    return parsed;
  } catch (error) {
    console.error('Error parsing email with AI:', error);
    return null;
  }
}

/**
 * UNIFIED Processor: Filters AND Parses in one single AI call to save API quota.
 */
export async function unifiedEmailProcessor(
  from: string,
  subject: string,
  body: string
): Promise<AIParserResult | null> {
  try {
    const prompt = `Analyze this real estate email and both CLASSIFY (is it a lead?) and EXTRACT data.

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body.substring(0, 1500)}${body.length > 1500 ? '...' : ''}

STEP 1: Classify
- isLead: true if this is a genuine inquiry about property.
- category: inquiry, spam, newsletter, thanks, notification.
- reason: brief explanation.

STEP 2: Extract (only if isLead is true)
- tenant_name, tenant_email, tenant_phone, property_address, intent (viewing/inquiry/booking/question), urgency (high/medium/low), budget, move_in_date.
- original_message: The client's NEW message only. Strip any quoted reply text (lines starting with >, "On ... wrote:", forwarded content, signatures). Copy the actual new content VERBATIM.
- message: Short internal CRM summary (1-2 sentences).

Return ONLY valid JSON:
{
  "isLead": boolean,
  "confidence": 0-100,
  "category": "string",
  "reason": "string",
  "tenant_name": "string or null",
  "tenant_email": "string or null",
  "tenant_phone": "string or null",
  "original_message": "string or null",
  "message": "string or null",
  "source": "zillow/airbnb/facebook/email",
  "property_address": "string or null",
  "intent": "string or null",
  "urgency": "string or null",
  "budget": "string or null",
  "move_in_date": "string or null"
}`;

    const { generateContentWithRetry } = await import('./gemini-client');
    const result = await generateContentWithRetry(model, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();
    let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    const parsed: AIParserResult = JSON.parse(cleanText);

    if (parsed.isLead) {
       // Ensure email
       if (!parsed.tenant_email) {
          const emailMatch = from.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) parsed.tenant_email = emailMatch[0];
       }
       console.log(`🤖 Unified AI: ✅ LEAD - ${parsed.reason}`);
    } else {
       console.log(`🤖 Unified AI: ⏭️ SKIP - ${parsed.reason}`);
    }

    return parsed;
  } catch (error) {
    console.error('❌ Error in Unified AI processor:', error);
    return null;
  }
}

/**
 * Fallback regex-based parser (free but less accurate)
... (rest of regexParse)
 */
function regexParse(
  from: string,
  subject: string,
  body: string,
  source: string
): AIParserResult {
  // Extract email
  const emailMatch = from.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract name
  const nameMatch = from.match(/^([^<]+)</);
  let name = nameMatch ? nameMatch[1].trim().replace(/["']/g, '') : email.split('@')[0];
  
  // Extract phone
  const phoneMatch = body.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Extract address from subject or body
  const addressMatch = subject.match(/(?:Re:|about|for)\s*(.+?)(?:\s*-|\s*$)/i) ||
                       body.match(/(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[^.]*)/i);
  const address = addressMatch ? addressMatch[1].trim() : undefined;
  
  // Clean message
  let message = body
    .replace(/On .+ wrote:/g, '')
    .replace(/_{3,}/g, '')
    .replace(/^[>].*$/gm, '')
    .trim();
  
  if (message.length > 1000) {
    message = message.substring(0, 1000) + '...';
  }
  
  // Detect intent
  let intent: 'viewing' | 'inquiry' | 'booking' | 'question' = 'inquiry';
  if (/schedule|viewing|tour|visit|see/i.test(body)) intent = 'viewing';
  else if (/book|reserve|rent|lease/i.test(body)) intent = 'booking';
  else if (/question|ask|wondering|curious/i.test(body)) intent = 'question';
  
  // Detect urgency
  let urgency: 'high' | 'medium' | 'low' = 'medium';
  if (/urgent|asap|immediately|today|this week/i.test(body)) urgency = 'high';
  else if (/just browsing|no rush|curious/i.test(body)) urgency = 'low';
  
  // Extract budget
  const budgetMatch = body.match(/\$\d{1,3}(?:,\d{3})*(?:\/month|\/mo|k)?/);
  const budget = budgetMatch ? budgetMatch[0] : undefined;
  
  return {
    tenant_name: name || 'Unknown',
    tenant_email: email,
    tenant_phone: phone,
    message: message || subject,
    source,
    property_address: address,
    intent,
    urgency,
    budget,
    isLead: true, // Assume it's a lead if we're parsing it
    confidence: 50,
    reason: 'Parsed using regex (AI fallback)',
  };
}
