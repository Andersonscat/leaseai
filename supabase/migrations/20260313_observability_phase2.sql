-- ============================================
-- OBSERVABILITY PHASE 2: daily_metrics + ai_feedback
-- ============================================

-- Aggregated metrics per user per day (for charts)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL,
  date            date NOT NULL,
  ai_responses    integer DEFAULT 0,
  ai_errors       integer DEFAULT 0,
  ai_avg_latency_ms integer DEFAULT 0,
  ai_total_tokens integer DEFAULT 0,
  ai_estimated_cost numeric(10, 6) DEFAULT 0,
  gmail_syncs     integer DEFAULT 0,
  gmail_errors    integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_sent   integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can upsert metrics"
  ON daily_metrics FOR ALL
  WITH CHECK (true);

-- User feedback on AI responses (thumbs up/down)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  tenant_id   uuid,
  message_id  uuid,
  trace_id    text,
  rating      smallint NOT NULL CHECK (rating IN (-1, 1)),
  comment     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_trace_id ON ai_feedback(trace_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON ai_feedback FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
