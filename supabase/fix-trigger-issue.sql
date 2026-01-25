-- =====================================================
-- FIX: Remove problematic trigger
-- =====================================================
-- The auto_update_lead_quality trigger is causing stack overflow
-- We'll update scores from the API instead
-- =====================================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS auto_update_lead_quality ON tenants;

-- Drop the trigger function
DROP FUNCTION IF EXISTS trigger_update_lead_quality();

-- Keep the helper functions (we'll use them from API)
-- calculate_lead_score() and update_lead_quality() remain

COMMENT ON TABLE tenants IS 'Lead scores will be updated from the API, not via trigger, to avoid stack overflow';
