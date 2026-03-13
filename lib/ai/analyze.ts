import { generateContentWithRetry } from '@/lib/gemini-client';
import { geminiJsonModel } from '@/lib/ai/models';
import type { TenantData, TenantQuestionnaire } from '@/lib/ai/types';

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
