import { createClient } from '@supabase/supabase-js';
import { gmailLogger } from './logger';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type SystemEventType =
  | 'gmail_webhook'
  | 'gmail_sync'
  | 'gmail_sync_error'
  | 'oauth_refresh'
  | 'oauth_refresh_error'
  | 'auto_reply_sent'
  | 'auto_reply_error'
  | 'hallucination_blocked'
  | 'guardrail_blocked'
  | 'agent_fallback';

export interface SystemEventData {
  traceId?: string;
  userId?: string;
  eventType: SystemEventType;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
  latencyMs?: number;
  error?: string;
}

export async function recordSystemEvent(event: SystemEventData): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.from('system_events').insert({
    trace_id: event.traceId || null,
    user_id: event.userId || null,
    event_type: event.eventType,
    status: event.status,
    metadata: event.metadata || null,
    latency_ms: event.latencyMs || null,
    error: event.error || null,
  });

  if (error) {
    gmailLogger.warn({ error, eventType: event.eventType }, 'Failed to insert system_event');
  }
}
