import { createClient } from '@supabase/supabase-js';
import logger from './logger';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type MetricField =
  | 'ai_responses'
  | 'ai_errors'
  | 'ai_total_tokens'
  | 'gmail_syncs'
  | 'gmail_errors'
  | 'messages_received'
  | 'messages_sent';

/**
 * Increment a daily metric counter for a user.
 * Uses upsert with ON CONFLICT to create or increment atomically.
 */
export async function incrementMetric(
  userId: string,
  field: MetricField,
  amount: number = 1
): Promise<void> {
  const supabase = getAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.rpc('increment_daily_metric', {
    p_user_id: userId,
    p_date: today,
    p_field: field,
    p_amount: amount,
  });

  if (error) {
    // Fallback: try upsert if RPC doesn't exist yet
    if (error.message?.includes('function') || error.code === '42883') {
      await upsertMetricFallback(userId, today, field, amount);
    } else {
      logger.warn({ error, userId, field }, 'Failed to increment metric');
    }
  }
}

/**
 * Record AI latency for averaging in daily metrics.
 */
export async function recordAiLatency(
  userId: string,
  latencyMs: number,
  tokens: number,
  cost: number
): Promise<void> {
  await incrementMetric(userId, 'ai_responses');
  await incrementMetric(userId, 'ai_total_tokens', tokens);

  const supabase = getAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Update avg latency and cost
  const { data: existing } = await supabase
    .from('daily_metrics')
    .select('ai_responses, ai_avg_latency_ms, ai_estimated_cost')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    const count = existing.ai_responses || 1;
    const prevAvg = existing.ai_avg_latency_ms || 0;
    const newAvg = Math.round(prevAvg + (latencyMs - prevAvg) / count);

    await supabase
      .from('daily_metrics')
      .update({
        ai_avg_latency_ms: newAvg,
        ai_estimated_cost: (existing.ai_estimated_cost || 0) + cost,
      })
      .eq('user_id', userId)
      .eq('date', today);
  }
}

async function upsertMetricFallback(
  userId: string,
  date: string,
  field: MetricField,
  amount: number
): Promise<void> {
  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from('daily_metrics')
    .select('id, ' + field)
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (existing) {
    await supabase
      .from('daily_metrics')
      .update({ [field]: (existing[field] || 0) + amount })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('daily_metrics')
      .insert({ user_id: userId, date, [field]: amount });
  }
}
