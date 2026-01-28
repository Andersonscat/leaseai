// AI-powered email filtering
// Uses Gemini 1.5 Flash to intelligently determine if an email is a real lead

import { geminiModel, generateContentWithRetry } from '@/lib/gemini-client';

const model = geminiModel;

interface FilterResult {
  isLead: boolean;
  confidence: number;        // 0-100
  reason: string;            // Why it's a lead or not
  category: string;          // 'inquiry', 'spam', 'newsletter', 'thanks', 'notification'
  suggestedAction: string;   // 'import', 'skip', 'review'
}

/**
 * AI-powered filter to determine if email is a real lead
 * Much smarter than regex - understands context
 */
export async function isRealLeadAI(
  from: string,
  subject: string,
  body: string
): Promise<FilterResult> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GOOGLE_GEMINI_API_KEY not set, falling back to regex filter');
      return fallbackFilter(from, subject, body);
    }
    
    // Prepare prompt for AI
    const prompt = `You are an expert at filtering real estate lead emails from spam/newsletters.

Analyze this email and determine if it's a REAL LEAD (genuine inquiry from potential tenant/buyer).

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body.substring(0, 1500)}${body.length > 1500 ? '...' : ''}

Classify as:
- "inquiry" - Real lead asking about property
- "spam" - Marketing, promotions, upgrades
- "newsletter" - Weekly reports, market updates  
- "thanks" - Thank you messages (not a new lead)
- "notification" - System notifications, confirmations

Return ONLY valid JSON:
{
  "isLead": true/false,
  "confidence": 0-100,
  "reason": "brief explanation",
  "category": "inquiry/spam/newsletter/thanks/notification",
  "suggestedAction": "import/skip/review"
}

Examples:

REAL LEADS (isLead: true):
- "Hi, I'm interested in viewing the apartment"
- "Is this property still available?"
- "When can I schedule a tour?"
- "Question about the 2BR unit"

NOT LEADS (isLead: false):
- "Weekly market report - Unsubscribe here"
- "Upgrade to Zillow Premium today!"
- "Thanks for showing me the apartment yesterday"
- "Your listing is now live - Confirmation"`;

    const result = await generateContentWithRetry(model, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = result.response.text();

    if (!responseText) {
      console.error('❌ No content from Gemini');
      return fallbackFilter(from, subject, body);
    }

    // Parse JSON response
    let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Sometimes Gemini adds extra text, try to find JSON block
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];

    let filterResult: FilterResult;
    try {
      filterResult = JSON.parse(cleanText);
    } catch (e) {
      console.error('❌ Failed to parse JSON from Gemini:', e);
      return fallbackFilter(from, subject, body);
    }
    
    // Validate
    if (typeof filterResult.isLead !== 'boolean') {
      throw new Error('Invalid response format');
    }

    console.log(`🤖 AI Filter: ${filterResult.isLead ? '✅ LEAD' : '⏭️ SKIP'} - ${filterResult.reason} (${filterResult.confidence}% confidence)`);

    return filterResult;
  } catch (error) {
    console.error('❌ Error in AI filter:', error);
    return fallbackFilter(from, subject, body);
  }
}

/**
 * Fallback regex filter if AI is unavailable
 */
function fallbackFilter(from: string, subject: string, body: string): FilterResult {
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  
  // Check for spam keywords
  const spamKeywords = [
    'unsubscribe',
    'newsletter',
    'weekly report',
    'market update',
    'premium',
    'upgrade now',
    'thanks for',
    'thank you for',
    'confirmation email',
    'receipt',
    'invoice',
  ];
  
  const hasSpam = spamKeywords.some(kw => 
    subjectLower.includes(kw) || bodyLower.includes(kw)
  );
  
  if (hasSpam) {
    return {
      isLead: false,
      confidence: 80,
      reason: 'Contains spam/newsletter keywords',
      category: 'spam',
      suggestedAction: 'skip',
    };
  }
  
  // Check for lead keywords
  const leadKeywords = [
    'inquiry',
    'interested in',
    'question about',
    'viewing',
    'tour',
    'schedule',
    'availability',
    'booking request',
    'i would like',
    'looking for',
    'when can',
    'is this available',
  ];
  
  const hasLead = leadKeywords.some(kw =>
    subjectLower.includes(kw) || bodyLower.includes(kw)
  );
  
  if (hasLead) {
    return {
      isLead: true,
      confidence: 70,
      reason: 'Contains inquiry keywords',
      category: 'inquiry',
      suggestedAction: 'import',
    };
  }
  
  // Uncertain - default to skip
  return {
    isLead: false,
    confidence: 50,
    reason: 'No clear indicators',
    category: 'notification',
    suggestedAction: 'skip',
  };
}

/**
 * Batch filter multiple emails at once (more efficient)
 */
export async function batchFilterEmails(
  emails: Array<{ from: string; subject: string; body: string }>
): Promise<FilterResult[]> {
  // For now, process sequentially
  // TODO: Implement batch API call for better efficiency
  const results: FilterResult[] = [];
  
  for (const email of emails) {
    const result = await isRealLeadAI(email.from, email.subject, email.body);
    results.push(result);
  }
  
  return results;
}
