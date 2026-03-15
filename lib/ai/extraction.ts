import { genAI, generateContentWithRetry } from '@/lib/gemini-client';
import { SchemaType } from '@google/generative-ai';

// Dedicated model for structured extraction — no tools, JSON-only output
const extractionModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        personal: {
          type: SchemaType.OBJECT,
          properties: {
            firstName: { type: SchemaType.STRING, nullable: true },
            lastName: { type: SchemaType.STRING, nullable: true },
            phone: { type: SchemaType.STRING, nullable: true },
          },
        },
        budget: {
          type: SchemaType.OBJECT,
          properties: {
            max_monthly_rent: { type: SchemaType.NUMBER, nullable: true },
            budget_usd: { type: SchemaType.NUMBER, nullable: true },
          },
        },
        housing: {
          type: SchemaType.OBJECT,
          properties: {
            property_types: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
            bedrooms_min: { type: SchemaType.INTEGER, nullable: true },
            bathrooms_min: { type: SchemaType.INTEGER, nullable: true },
            furnished: { type: SchemaType.STRING, nullable: true },
          },
        },
        timeline: {
          type: SchemaType.OBJECT,
          properties: {
            move_in_date: { type: SchemaType.STRING, nullable: true },
            lease_term_ideal_months: { type: SchemaType.INTEGER, nullable: true },
          },
        },
        occupants: {
          type: SchemaType.OBJECT,
          properties: {
            total_count: { type: SchemaType.INTEGER, nullable: true },
          },
        },
        pets: {
          type: SchemaType.OBJECT,
          properties: {
            has_pets: { type: SchemaType.BOOLEAN, nullable: true },
            pet_type: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
          },
        },
        location: {
          type: SchemaType.OBJECT,
          properties: {
            city: { type: SchemaType.STRING, nullable: true },
            state: { type: SchemaType.STRING, nullable: true },
            neighborhoods_must: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
          },
        },
        amenities: {
          type: SchemaType.OBJECT,
          properties: {
            desired_features: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
            deal_breakers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, nullable: true },
            parking: {
              type: SchemaType.OBJECT,
              properties: {
                required: { type: SchemaType.STRING, nullable: true },
              },
              nullable: true,
            },
          },
        },
      },
    },
  } as any,
});

const EXTRACTION_PROMPT = `You are a data extraction assistant for a real estate leasing platform.

Extract ALL client information from the conversation. Return ONLY data the client explicitly stated or clearly implied.

Rules:
- "no pets" → has_pets: false
- "2-bedroom" or "2 bed" → bedrooms_min: 2
- "$2,500" or "budget of 2500" → budget_usd: 2500 AND max_monthly_rent: 2500
- "April 1st" or "beginning of April" → move_in_date: "2026-04-01"
- "just me" or "I live alone" → total_count: 1
- "couple" or "me and my partner" → total_count: 2
- "Seattle" → city: "Seattle", state: "WA"
- "looking to rent" or "rent" → property_types: ["rent"]
- "looking to buy" or "buy" → property_types: ["buy"]
- "12 month", "12 months", "1 year", "year lease" → lease_term_ideal_months: 12
- "6 months", "half year" → lease_term_ideal_months: 6
- "month to month", "monthly" → lease_term_ideal_months: 1
- Short answers like "rent", "12 months", "yes", "no" are valid — extract from context of the full conversation
- If a field is NOT mentioned, set it to null
- Do NOT guess or fabricate data
- For move_in_date, use ISO format (YYYY-MM-DD). Current year is ${new Date().getFullYear()}.`;

export interface ExtractionResult {
  data: Record<string, any>;
  hasData: boolean;
}

/**
 * Force-extract client data from a message using Gemini Structured Output.
 * This is a dedicated, cheap LLM call that ALWAYS returns JSON.
 * Used as a reliability layer before the main agent pipeline.
 */
export async function extractClientData(
  latestMessage: string,
  conversationHistory?: { role: string; content: string }[],
): Promise<ExtractionResult> {
  const t0 = Date.now();
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const contextMessages = conversationHistory?.slice(-6)
        .map(m => `[${m.role === 'user' ? 'Client' : 'Agent'}]: ${m.content.slice(0, 400)}`)
        .join('\n') || '';

      const isShortMessage = latestMessage.trim().split(/\s+/).length <= 5;
      const shortMsgHint = isShortMessage
        ? `\nIMPORTANT: The latest message is a SHORT ANSWER to a previous question. Examine the conversation to understand WHAT was asked, then extract the answer. Example: if the agent asked about lease duration and the client replied "12 months", extract lease_term_ideal_months: 12.`
        : '';

      const prompt = contextMessages
        ? `${EXTRACTION_PROMPT}${shortMsgHint}\n\nRecent conversation:\n${contextMessages}\n\nLatest client message:\n${latestMessage}`
        : `${EXTRACTION_PROMPT}\n\nClient message:\n${latestMessage}`;

      const result = await generateContentWithRetry(extractionModel, [{ text: prompt }]);
      const text = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn(`⚠️ Extraction: empty response (attempt ${attempt}/${MAX_ATTEMPTS})`);
        continue;
      }

      const parsed = JSON.parse(text);
      const cleaned = stripNulls(parsed);
      const hasData = Object.keys(cleaned).length > 0;

      console.log(`🔍 Extraction (${Date.now() - t0}ms, attempt ${attempt}): ${hasData ? JSON.stringify(cleaned) : 'no data found'}`);

      return { data: cleaned, hasData };
    } catch (err) {
      console.warn(`⚠️ Extraction attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err instanceof Error ? err.message : err);
      if (attempt === MAX_ATTEMPTS) {
        console.error('⚠️ Extraction failed after all attempts');
        return { data: {}, hasData: false };
      }
    }
  }

  return { data: {}, hasData: false };
}

/**
 * Remove null/undefined values and empty objects recursively.
 */
function stripNulls(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const filtered = obj.filter(v => v !== null && v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const v = stripNulls(value);
      if (v !== undefined) cleaned[key] = v;
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
}

/**
 * Merge extraction data with agent-extracted data.
 * Agent data takes priority (it may have refined values via tool calls).
 */
export function mergeExtractionWithAgent(
  extractionData: Record<string, any>,
  agentData: Record<string, any> | null,
): Record<string, any> {
  if (!agentData) return extractionData;
  if (!extractionData || Object.keys(extractionData).length === 0) return agentData;

  const merged: Record<string, any> = {};

  const allKeys = Array.from(new Set([...Object.keys(extractionData), ...Object.keys(agentData)]));
  for (const key of allKeys) {
    const ext = extractionData[key];
    const agent = agentData[key];

    if (agent && typeof agent === 'object' && ext && typeof ext === 'object' && !Array.isArray(agent)) {
      merged[key] = { ...ext, ...agent };
    } else if (agent !== null && agent !== undefined) {
      merged[key] = agent;
    } else if (ext !== null && ext !== undefined) {
      merged[key] = ext;
    }
  }

  return merged;
}
