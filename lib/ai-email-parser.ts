// AI-Powered Email Parser using OpenAI
// This intelligently extracts lead information from any email

interface AIParserResult {
  tenant_name: string;
  tenant_email: string;
  tenant_phone?: string;
  message: string;
  source: string; // zillow, airbnb, facebook, email, etc
  property_address?: string;
  intent?: 'viewing' | 'inquiry' | 'booking' | 'question';
  urgency?: 'high' | 'medium' | 'low';
  budget?: string;
  move_in_date?: string;
}

/**
 * AI-powered email parsing with GPT-4o-mini
 * Cost: ~$0.002 per email
 */
export async function parseEmailWithAI(
  from: string,
  subject: string,
  body: string
): Promise<AIParserResult | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OPENAI_API_KEY not set, falling back to regex parsing');
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
4. message: Clean summary of their inquiry (2-3 sentences max)
5. source: Which platform (zillow, airbnb, facebook, craigslist, email, other)
6. property_address: Address of the property they're interested in
7. intent: What they want (viewing, inquiry, booking, question)
8. urgency: high (needs ASAP), medium (within week), low (just browsing)
9. budget: Their budget if mentioned (e.g. "$2000/month", "$500k")
10. move_in_date: When they want to move in if mentioned

Return ONLY valid JSON. If information is not found, use null.

Example output:
{
  "tenant_name": "John Smith",
  "tenant_email": "john@example.com",
  "tenant_phone": "+1-555-123-4567",
  "message": "Interested in viewing the 2BR apartment. Available this weekend.",
  "source": "zillow",
  "property_address": "123 Main St, San Francisco, CA",
  "intent": "viewing",
  "urgency": "high",
  "budget": "$2500/month",
  "move_in_date": "May 1, 2026"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only parser. Return only valid JSON, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content from OpenAI');
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content.trim());
    
    // Validate required fields
    if (!parsed.tenant_name || !parsed.tenant_email || !parsed.message) {
      console.error('Missing required fields from AI parsing');
      return null;
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
 * AI-only parser: Always use AI for best accuracy
 * Cost: ~$0.0002 per email (~$0.30/month for 50 emails/day)
 */
export async function hybridEmailParser(
  from: string,
  subject: string,
  body: string
): Promise<AIParserResult | null> {
  // Try AI first
  const aiResult = await parseEmailWithAI(from, subject, body);
  
  if (aiResult) {
    return aiResult;
  }

  // Fallback to regex if AI fails (no API key or error)
  console.warn('AI parsing failed, using regex fallback');
  
  // Detect source from email
  const fromLower = from.toLowerCase();
  let source = 'email';
  if (fromLower.includes('zillow.com')) source = 'zillow';
  else if (fromLower.includes('airbnb.com')) source = 'airbnb';
  else if (fromLower.includes('facebook')) source = 'facebook';
  else if (fromLower.includes('craigslist.org')) source = 'craigslist';
  
  return regexParse(from, subject, body, source);
}

/**
 * Check if email has simple format (can be parsed with regex)
 */
function isSimpleFormat(body: string): boolean {
  // Simple emails typically have clear patterns
  const hasPhone = /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(body);
  const hasAddress = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/i.test(body);
  const isShort = body.length < 500;
  
  return hasPhone && hasAddress && isShort;
}

/**
 * Fallback regex-based parser (free but less accurate)
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
    .replace(/^>.*$/gm, '')
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
  };
}
