import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.warn('⚠️ GOOGLE_GEMINI_API_KEY is not set in environment variables');
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Wrapper for generateContent with retry logic for 429 (Rate Limit) errors
 */
export async function generateContentWithRetry(model: any, prompt: any, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      if (error.message?.includes('429') || error.status === 429) {
        attempt++;
        console.warn(`⚠️ Gemini 429 Rate Limit. Retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff: 2s, 4s, 6s
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded for Gemini API');
}
