import { createClient } from '@supabase/supabase-js';
import { aiLogger } from './logger';
import { generateTraceId } from './tracer';
import { recordAiLatency, incrementMetric } from './metrics';

const GEMINI_FLASH_COST_PER_1K_INPUT = 0.000075;
const GEMINI_FLASH_COST_PER_1K_OUTPUT = 0.0003;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface AiTraceData {
  traceId: string;
  userId: string;
  tenantId: string;
  trigger: 'webhook' | 'manual' | 'auto' | 'simulate';
  promptSummary: string;
  promptTokens: number;
  responseText: string;
  responseTokens: number;
  toolCalls: string[];
  model: string;
  latencyMs: number;
  estimatedCost: number;
  guardrailResult: 'pass' | 'blocked' | null;
  error: string | null;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * GEMINI_FLASH_COST_PER_1K_INPUT +
    (outputTokens / 1000) * GEMINI_FLASH_COST_PER_1K_OUTPUT
  );
}

/**
 * Wraps an AI pipeline call, recording timing, tokens, and results into agent_traces.
 */
export async function traceAiCall<T>(
  params: {
    userId: string;
    tenantId: string;
    trigger: AiTraceData['trigger'];
    promptText: string;
    model?: string;
  },
  fn: () => Promise<T & { responseText: string; toolsUsed: string[]; thoughtProcess: string }>
): Promise<T & { responseText: string; toolsUsed: string[]; thoughtProcess: string }> {
  const traceId = generateTraceId();
  const startedAt = Date.now();
  const log = aiLogger.child({ traceId, tenantId: params.tenantId });

  log.info({ trigger: params.trigger }, 'AI pipeline started');

  let result: T & { responseText: string; toolsUsed: string[]; thoughtProcess: string };
  let error: string | null = null;
  let guardrailResult: AiTraceData['guardrailResult'] = null;

  try {
    result = await fn();
    log.info(
      {
        toolsUsed: result.toolsUsed,
        responseLength: result.responseText.length,
        latencyMs: Date.now() - startedAt,
      },
      'AI pipeline completed'
    );
  } catch (err: any) {
    error = err.message || 'Unknown error';
    log.error({ err, latencyMs: Date.now() - startedAt }, 'AI pipeline failed');
    throw err;
  } finally {
    const latencyMs = Date.now() - startedAt;
    const promptTokens = estimateTokens(params.promptText);
    const responseTokens = result! ? estimateTokens(result.responseText) : 0;

    const trace: AiTraceData = {
      traceId,
      userId: params.userId,
      tenantId: params.tenantId,
      trigger: params.trigger,
      promptSummary: params.promptText.slice(0, 500),
      promptTokens,
      responseText: result?.responseText?.slice(0, 2000) || '',
      responseTokens,
      toolCalls: result?.toolsUsed || [],
      model: params.model || 'gemini-2.5-flash',
      latencyMs,
      estimatedCost: estimateCost(promptTokens, responseTokens),
      guardrailResult,
      error,
    };

    saveTrace(trace).catch((saveErr) => {
      log.warn({ err: saveErr }, 'Failed to save AI trace (non-blocking)');
    });

    // Record metrics (non-blocking)
    if (error) {
      incrementMetric(params.userId, 'ai_errors').catch(() => {});
    } else {
      recordAiLatency(params.userId, latencyMs, promptTokens + responseTokens, trace.estimatedCost).catch(() => {});
    }
  }

  return result!;
}

/**
 * Mark a trace as guardrail-blocked (call after hallucination check).
 */
export function setGuardrailResult(
  traceId: string,
  result: 'pass' | 'blocked'
): void {
  getAdminClient()
    .from('agent_traces')
    .update({ guardrail_result: result })
    .eq('trace_id', traceId)
    .then(() => {})
    .catch((err) => aiLogger.warn({ err, traceId }, 'Failed to update guardrail result'));
}

async function saveTrace(trace: AiTraceData): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.from('agent_traces').insert({
    trace_id: trace.traceId,
    user_id: trace.userId,
    tenant_id: trace.tenantId,
    trigger: trace.trigger,
    prompt_summary: trace.promptSummary,
    prompt_tokens: trace.promptTokens,
    response_text: trace.responseText,
    response_tokens: trace.responseTokens,
    tool_calls: trace.toolCalls,
    model: trace.model,
    latency_ms: trace.latencyMs,
    estimated_cost: trace.estimatedCost,
    guardrail_result: trace.guardrailResult,
    error: trace.error,
  });

  if (error) {
    aiLogger.warn({ error, traceId: trace.traceId }, 'Failed to insert agent_trace');
  }
}
