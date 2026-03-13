/**
 * ai-qualification.ts — backward-compatible re-export hub.
 *
 * All logic has been extracted into focused modules:
 *   lib/ai/types.ts        — shared TypeScript interfaces
 *   lib/ai/models.ts       — Gemini model instances & system prompt
 *   lib/ai/analyze.ts      — analyzeConversation, extractLeadData
 *   lib/ai/brain.ts        — analyzeBrain (lightweight pipeline)
 *   lib/ai/voice.ts        — generateFinalResponse
 *   lib/ai/guardrails.ts   — validateBookingAction, verifyResponseHallucinations
 *   lib/ai/utils.ts        — maskPII, flattenExtractedData, formatBookingDetails
 *   lib/scoring/property-match.ts — scorePropertyMatch, getRankedPropertyMatches, inferStateFromProperties
 *   lib/scoring/lead-score.ts     — calculateLeadScore, getLeadQuality
 *
 * Existing imports like `import { analyzeConversation } from '@/lib/ai-qualification'`
 * continue to work without changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  TenantData,
  TenantQuestionnaire,
  Property,
  ConversationContext,
  AiAnalysis,
  VerificationResult,
  ClusterBreakdown,
  ScoringResult,
  RankedPropertyMatch,
  BrainResult,
  TenantLike,
  PropertyLike,
} from '@/lib/ai/types';

// ─── AI Pipeline ────────────────────────────────────────────────────────────
export { analyzeConversation, analyzeBrain } from '@/lib/ai/brain';
export { extractLeadData } from '@/lib/ai/analyze';
export { generateFinalResponse } from '@/lib/ai/voice';

// ─── Guardrails ─────────────────────────────────────────────────────────────
export { validateBookingAction, verifyResponseHallucinations } from '@/lib/ai/guardrails';

// ─── Scoring ────────────────────────────────────────────────────────────────
export { scorePropertyMatch, getRankedPropertyMatches, inferStateFromProperties } from '@/lib/scoring/property-match';
export { calculateLeadScore, getLeadQuality } from '@/lib/scoring/lead-score';

// ─── Utilities ──────────────────────────────────────────────────────────────
export { maskPII, flattenExtractedData, formatBookingDetails } from '@/lib/ai/utils';
