-- ============================================
-- OBSERVABILITY: agent_traces + system_events
-- ============================================

-- Full trace of every AI agent invocation
CREATE TABLE IF NOT EXISTS agent_traces (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id      text NOT NULL UNIQUE,
  user_id       uuid NOT NULL,
  tenant_id     uuid,
  trigger       text NOT NULL CHECK (trigger IN ('webhook', 'manual', 'auto', 'simulate')),
  prompt_summary text,
  prompt_tokens  integer DEFAULT 0,
  response_text  text,
  response_tokens integer DEFAULT 0,
  tool_calls     jsonb DEFAULT '[]'::jsonb,
  model          text DEFAULT 'gemini-2.5-flash',
  latency_ms     integer,
  estimated_cost numeric(10, 6) DEFAULT 0,
  guardrail_result text CHECK (guardrail_result IN ('pass', 'blocked') OR guardrail_result IS NULL),
  error          text,
  created_at     timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_traces_user_id ON agent_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_tenant_id ON agent_traces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_created_at ON agent_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_traces_trigger ON agent_traces(trigger);
CREATE INDEX IF NOT EXISTS idx_agent_traces_error ON agent_traces(error) WHERE error IS NOT NULL;

-- RLS: users see only their own traces
ALTER TABLE agent_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own traces"
  ON agent_traces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert traces"
  ON agent_traces FOR INSERT
  WITH CHECK (true);

-- System events: Gmail sync, webhook, OAuth, etc.
CREATE TABLE IF NOT EXISTS system_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id    text,
  user_id     uuid,
  event_type  text NOT NULL,
  status      text NOT NULL CHECK (status IN ('success', 'error')),
  metadata    jsonb DEFAULT '{}'::jsonb,
  latency_ms  integer,
  error       text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_events_user_id ON system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON system_events(status) WHERE status = 'error';

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON system_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert events"
  ON system_events FOR INSERT
  WITH CHECK (true);
