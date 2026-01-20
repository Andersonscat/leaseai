-- Updated usage tracking for practical limits
-- Track: contacts, daily AI assistant usage, daily auto-responses
-- Email parsing is unlimited (included in plan)

-- Daily usage tracking (resets every day at midnight)
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL,  -- 'aiAssistant', 'autoResponse'
  date DATE NOT NULL,             -- YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One row per user/feature/date
  UNIQUE(user_id, feature, date)
);

-- Index for fast daily lookups
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date 
ON daily_usage(user_id, date);

-- User plans (unchanged from before)
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',  -- 'free', 'solo', 'team', 'business'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get today's usage
CREATE OR REPLACE FUNCTION get_daily_usage(
  p_user_id UUID,
  p_feature VARCHAR,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count INTO v_count
  FROM daily_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND date = p_date;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment daily usage
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_feature VARCHAR,
  p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_usage (user_id, feature, date, count, updated_at)
  VALUES (p_user_id, p_feature, CURRENT_DATE, p_amount, NOW())
  ON CONFLICT (user_id, feature, date)
  DO UPDATE SET 
    count = daily_usage.count + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get active contacts count
CREATE OR REPLACE FUNCTION get_active_contacts_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM tenants
  WHERE user_id = p_user_id
    AND status != 'Archived';
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's plan
CREATE OR REPLACE FUNCTION get_user_plan(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_plan VARCHAR;
BEGIN
  SELECT plan INTO v_plan
  FROM user_plans
  WHERE user_id = p_user_id
    AND status = 'active';
  
  RETURN COALESCE(v_plan, 'free');
END;
$$ LANGUAGE plpgsql;

-- Cleanup old daily usage (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_daily_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM daily_usage
  WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily at 2 AM)
-- Note: You'll need pg_cron extension or external scheduler
-- SELECT cron.schedule('cleanup-daily-usage', '0 2 * * *', 'SELECT cleanup_old_daily_usage()');

-- RLS Policies
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily usage"
  ON daily_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage daily usage"
  ON daily_usage FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE daily_usage IS 'Tracks daily usage of AI features (resets at midnight)';
COMMENT ON COLUMN daily_usage.feature IS 'aiAssistant or autoResponse';
COMMENT ON COLUMN daily_usage.date IS 'Date for this usage count (YYYY-MM-DD)';
