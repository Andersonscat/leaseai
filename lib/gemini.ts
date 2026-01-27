import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Get Gemini 2.5 Flash model (stable and fast)
export const geminiFlash = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
});

// Helper function for text generation
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await geminiFlash.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Helper function for structured output (JSON)
export async function generateJSON<T>(prompt: string): Promise<T> {
  try {
    const result = await geminiFlash.generateContent(
      prompt + '\n\nRespond ONLY with valid JSON, no markdown formatting.'
    );
    const response = result.response;
    const text = response.text();
    
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Gemini JSON parsing error:', error);
    throw error;
  }
}

// Email classification
export async function classifyEmail(emailContent: string) {
  const prompt = `Analyze this email and determine if it's a potential real estate lead.

Email content:
${emailContent}

Return JSON with:
{
  "isLead": boolean,
  "confidence": number (0-100),
  "intent": "inquiry" | "viewing_request" | "general_question" | "spam",
  "extractedInfo": {
    "name": string or null,
    "phone": string or null,
    "budget": string or null,
    "preferences": string or null
  }
}`;

  return generateJSON<{
    isLead: boolean;
    confidence: number;
    intent: string;
    extractedInfo: {
      name: string | null;
      phone: string | null;
      budget: string | null;
      preferences: string | null;
    };
  }>(prompt);
}

// Generate response to client
export async function generateEmailResponse(
  clientRequest: string,
  properties: any[]
) {
  const prompt = `You are a professional real estate agent assistant.

Client request:
${clientRequest}

Available properties:
${JSON.stringify(properties, null, 2)}

Generate a friendly, professional email response that:
1. Acknowledges their request
2. Presents 2-3 best matching properties with details
3. Asks about preferred viewing time
4. Requests additional info if needed

Keep the tone warm and helpful. Write in the same language as the client's request.`;

  return generateText(prompt);
}
