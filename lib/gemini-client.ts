import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.warn('⚠️ GOOGLE_GEMINI_API_KEY is not set in environment variables');
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

/**
 * Wrapper for generateContent with retry logic for 429 (Rate Limit) errors
 */
export async function generateContentWithRetry(model: any, prompt: any, maxRetries = 5): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      const errorMsg = error.message || '';
      const isRateLimit = errorMsg.includes('429') || error.status === 429 || errorMsg.toLowerCase().includes('rate limit');
      
      if (isRateLimit) {
        attempt++;
        // Shorter backoff for paid plans or light 429s: 2s, 4s, 8s...
        const delay = (Math.pow(2, attempt) * 1000) + (Math.random() * 1000); 
        console.warn(`⚠️ Gemini Rate Limit. Attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's a 500 or other error, also try to retry but maybe fewer times
      if (error.status >= 500 && attempt < 2) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      throw error;
    }
  }
  throw new Error('Max retries exceeded for Gemini API');
}
