import { genAI } from '@/lib/gemini-client';
import { buildSystemPrompt } from '@/lib/ai/prompts';

// Fast model for Brain pipeline (analyzeBrain)
// thinkingBudget: 0 disables thinking tokens → behaves like a regular fast model
export const geminiFlashModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: '',
  generationConfig: {
    temperature: 0.15,
    topP: 0.4,
    maxOutputTokens: 8192,
    // @ts-ignore — thinkingConfig is valid for Gemini 2.5 models
    thinkingConfig: { thinkingBudget: 0 },
  }
});

// Full qualification system prompt — composed from modular segments
export const QUALIFICATION_SYSTEM_PROMPT = buildSystemPrompt();

// JSON model with system prompt for analyzeConversation + extractLeadData
export const geminiJsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: QUALIFICATION_SYSTEM_PROMPT,
  generationConfig: { 
    temperature: 0.1, 
    topP: 0.4,
  }
});
