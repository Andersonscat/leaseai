-- Migration: Legal compliance features
-- 1. AI audit trail table
-- 2. do_not_contact flag on tenants
-- 3. PII anonymization function

-- ─── 1. AI Audit Trail ────────────────────────────────────────────────────────
-- Every AI decision is logged for legal defensibility (Fair Housing audits, etc.)
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
  conversation_id UUID,
  action          TEXT NOT NULL,           -- 'reply' | 'send_listing' | 'book_calendar' | 'escalate'
  intent          TEXT,
  escalation_reason TEXT,
  thought_process TEXT,                    -- AI's internal reasoning (for audit)
  property_matches JSONB,                  -- scored matches at time of decision
  extracted_data  JSONB,                   -- tenant data snapshot at time of decision
  ai_model        TEXT,                    -- which model was used
  response_ms     INTEGER,                 -- latency
  was_hallucination_blocked BOOLEAN DEFAULT false,
  ip_address      TEXT,
  user_agent      TEXT
);

-- Index for fast lookups by tenant and date
CREATE INDEX IF NOT EXISTS idx_ai_audit_tenant ON ai_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_action  ON ai_audit_log(action, created_at DESC);

-- RLS: only authenticated users can read audit logs
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read audit logs"
  ON ai_audit_log FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 2. Do Not Contact flag ────────────────────────────────────────────────────
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS do_not_contact        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS do_not_contact_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS do_not_contact_reason TEXT,         -- 'opt_out' | 'legal_hold' | 'manual'
  ADD COLUMN IF NOT EXISTS resubscribed_at       TIMESTAMPTZ;  -- if they sent START after STOP

-- Index for filtering out opted-out tenants
CREATE INDEX IF NOT EXISTS idx_tenants_do_not_contact ON tenants(do_not_contact) WHERE do_not_contact = true;

-- ─── 3. PII anonymization function ───────────────────────────────────────────
-- Called when a tenant exercises Right to be Forgotten
CREATE OR REPLACE FUNCTION anonymize_tenant_pii(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  -- Anonymize tenant record
  UPDATE tenants SET
    name             = 'Anonymized User',
    email            = 'anonymized-' || p_tenant_id || '@deleted.local',
    phone            = NULL,
    source           = 'anonymized',
    do_not_contact   = true,
    do_not_contact_at     = now(),
    do_not_contact_reason = 'gdpr_erasure'
  WHERE id = p_tenant_id;

  -- Anonymize all messages from this tenant
  UPDATE messages SET
    content = '[Message deleted per user request]'
  WHERE tenant_id = p_tenant_id;

  -- Log the erasure in audit trail
  INSERT INTO ai_audit_log (tenant_id, action, thought_process)
  VALUES (p_tenant_id, 'gdpr_erasure', 'PII anonymized per Right to be Forgotten request');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
