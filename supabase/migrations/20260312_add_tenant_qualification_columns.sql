-- Migration: Add missing tenant qualification columns
-- These columns are needed by the AI pipeline to persist extracted data.
-- Safe to re-run: uses IF NOT EXISTS everywhere.
--
-- Currently MISSING in production:
--   preferred_city, preferred_state, sqft_min, source, pipeline_stage,
--   escalation_reason, pending_checks, extracted_data
--
-- RUN THIS IN: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Location preferences (critical for property scoring)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_city TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_state TEXT;

-- Housing preferences
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sqft_min INTEGER;

-- Lead tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'New Lead';

-- Guardrails & escalation (for native function calling)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pending_checks JSONB DEFAULT '[]'::jsonb;

-- AI audit trail (raw extraction for debugging / replays)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- Geocoding: tenant preferred location coordinates
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_lat DOUBLE PRECISION;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_lng DOUBLE PRECISION;

-- Geocoding: property coordinates for distance scoring
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Also ensure auto_reply columns exist
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_auto_reply_at TIMESTAMPTZ;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenants_preferred_city ON tenants(preferred_city);
CREATE INDEX IF NOT EXISTS idx_tenants_preferred_state ON tenants(preferred_state);
CREATE INDEX IF NOT EXISTS idx_tenants_source ON tenants(source);
CREATE INDEX IF NOT EXISTS idx_tenants_pipeline_stage ON tenants(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_tenants_lead_quality ON tenants(lead_quality) WHERE lead_quality IN ('hot', 'warm');
CREATE INDEX IF NOT EXISTS idx_tenants_qualification_status ON tenants(qualification_status);
