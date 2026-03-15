import type { ConversationContext, KnownClientFields } from '@/lib/ai/types';
import type { AgentResult } from '@/lib/ai/agent';

// ─── Assertion Types ─────────────────────────────────────────────────────────

export type Assertion =
  | { type: 'action_equals'; value: string }
  | { type: 'action_not_equals'; value: string }
  | { type: 'tool_used'; tool: string }
  | { type: 'tool_not_used'; tool: string }
  | { type: 'extracted_field'; path: string; expected: any }
  | { type: 'response_contains'; value: string; caseSensitive?: boolean }
  | { type: 'response_not_contains'; value: string; caseSensitive?: boolean }
  | { type: 'response_language'; value: 'en' | 'ru' | 'es' }
  | { type: 'response_min_length'; value: number }
  | { type: 'response_max_length'; value: number }
  | { type: 'no_hallucinated_addresses' }
  | { type: 'escalation_reason_contains'; value: string }
  | { type: 'photo_mode_equals'; value: boolean }
  | { type: 'has_human_action_request' }
  | { type: 'custom'; name: string; fn: (result: AgentResult) => boolean; message?: string };

// ─── Eval Case ───────────────────────────────────────────────────────────────

export interface EvalCase {
  id: string;
  category: 'qualification' | 'tools' | 'guardrails' | 'language' | 'edge-cases' | 'multi-turn' | 'adversarial' | 'regression';
  name: string;
  context: ConversationContext;
  assertions: Assertion[];
}

// ─── Eval Result ─────────────────────────────────────────────────────────────

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  actual?: any;
  message?: string;
}

export interface EvalCaseResult {
  caseId: string;
  caseName: string;
  category: string;
  passed: boolean;
  assertions: AssertionResult[];
  agentResult: AgentResult;
  latencyMs: number;
  error?: string;
}

export interface EvalReport {
  timestamp: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
  results: EvalCaseResult[];
  totalLatencyMs: number;
}
