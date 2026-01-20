-- Usage tracking table for plan limits

CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL,  -- 'emailParsing', 'aiAssistant', etc
  month VARCHAR(7) NOT NULL,     -- 'YYYY-MM' format
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one row per user/feature/month
  UNIQUE(user_id, feature, month)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month 
ON usage_stats(user_id, month);

-- User plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',  -- 'free', 'starter', 'pro', 'enterprise'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',        -- 'active', 'cancelled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_usage(
  p_user_id UUID,
  p_feature VARCHAR,
  p_month VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_month VARCHAR;
  v_count INTEGER;
BEGIN
  -- Use current month if not specified
  v_month := COALESCE(p_month, TO_CHAR(NOW(), 'YYYY-MM'));
  
  SELECT count INTO v_count
  FROM usage_stats
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND month = v_month;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature VARCHAR,
  p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_month VARCHAR;
BEGIN
  v_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO usage_stats (user_id, feature, month, count, updated_at)
  VALUES (p_user_id, p_feature, v_month, p_amount, NOW())
  ON CONFLICT (user_id, feature, month)
  DO UPDATE SET 
    count = usage_stats.count + p_amount,
    updated_at = NOW();
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

-- RLS policies
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage"
  ON usage_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can modify
CREATE POLICY "Service can manage usage"
  ON usage_stats FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service can manage plans"
  ON user_plans FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE usage_stats IS 'Tracks monthly usage of features for billing/limits';
COMMENT ON TABLE user_plans IS 'Stores user subscription plans and Stripe info';
