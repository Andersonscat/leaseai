/**
 * ai-qualification.ts — backward-compatible re-export hub.
 *
 * Core modules:
 *   lib/ai/types.ts              — shared TypeScript interfaces
 *   lib/ai/agent.ts              — runAgentPipeline (unified tool-calling pipeline)
 *   lib/ai/tools.ts              — Gemini function declarations
 *   lib/ai/prompts.ts            — system prompt builder
 *   lib/ai/guardrails.ts         — validateBookingAction, verifyResponseHallucinations
 *   lib/ai/utils.ts              — maskPII, flattenExtractedData, formatBookingDetails
 *   lib/scoring/property-match.ts — scorePropertyMatch, getRankedPropertyMatches
 *   lib/scoring/lead-score.ts     — calculateLeadScore, getLeadQuality
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

// ─── Agent Pipeline ─────────────────────────────────────────────────────────
export { runAgentPipeline, type AgentResult } from '@/lib/ai/agent';

// ─── Guardrails ─────────────────────────────────────────────────────────────
export { validateBookingAction, verifyResponseHallucinations, checkResponseDuplication, runGuardrailPipeline } from '@/lib/ai/guardrails';
export type { GuardrailResult, GuardrailPipelineResult } from '@/lib/ai/guardrails';

// ─── Scoring ────────────────────────────────────────────────────────────────
export { scorePropertyMatch, getRankedPropertyMatches, inferStateFromProperties } from '@/lib/scoring/property-match';
export { calculateLeadScore, getLeadQuality } from '@/lib/scoring/lead-score';

// ─── Utilities ──────────────────────────────────────────────────────────────
export { maskPII, flattenExtractedData, formatBookingDetails, cleanMessageForHistory, detectAndEnrichDistance, extractKnownFields } from '@/lib/ai/utils';
