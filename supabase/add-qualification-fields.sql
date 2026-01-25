-- =====================================================
-- LEAD QUALIFICATION SYSTEM - Extended Fields
-- =====================================================
-- This migration adds comprehensive qualification fields
-- to track all lead information for smart AI conversations
-- =====================================================

-- Add financial qualification fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS budget_min INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS budget_max INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS credit_score VARCHAR(20); -- 'excellent', 'good', 'fair', 'poor', 'unknown'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50); -- 'employed', 'self_employed', 'student', 'retired'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS needs_cosigner BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_in_budget INTEGER; -- Total available for move-in costs

-- Add timeline and lease fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lease_duration VARCHAR(20); -- '12_months', '6_months', 'month_to_month', '24_months'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'medium'; -- 'high', 'medium', 'low'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reason_for_moving TEXT;

-- Add property requirement fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS min_sqft INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_sqft INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS property_type VARCHAR(50); -- 'apartment', 'house', 'condo', 'townhouse'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS furnishing VARCHAR(20); -- 'furnished', 'unfurnished', 'partial', 'flexible'

-- Add amenities (using JSONB for flexibility)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS required_amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_amenities JSONB DEFAULT '[]'::jsonb;
-- Example: ['gym', 'doorman', 'laundry_in_unit', 'elevator', 'pool', 'parking']

-- Add location preferences
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_neighborhoods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_commute_minutes INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS work_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS floor_preference VARCHAR(20); -- 'ground', 'high', 'middle', 'no_preference'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS view_preference VARCHAR(50); -- 'city', 'park', 'water', 'no_preference'

-- Add occupant information
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS num_occupants INTEGER DEFAULT 1;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS children_ages JSONB DEFAULT '[]'::jsonb; -- [5, 8, 12]
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pet_details JSONB DEFAULT '[]'::jsonb;
-- Example: [{"type": "dog", "size": "large", "breed": "Labrador", "weight": 70}]
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_smoker BOOLEAN DEFAULT false;

-- Add utilities and expenses preferences
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS utilities_included_preference JSONB DEFAULT '[]'::jsonb;
-- Example: ['water', 'heat', 'electricity', 'internet']
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_utility_budget INTEGER; -- Monthly budget for utilities

-- Add parking and transportation
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS needs_parking BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parking_type VARCHAR(50); -- 'street', 'driveway', 'garage', 'reserved', 'tandem'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS parking_budget INTEGER; -- Monthly parking budget
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS needs_ev_charging BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT false;

-- Add must-haves and deal breakers
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS must_haves JSONB DEFAULT '[]'::jsonb;
-- Example: ['in_unit_laundry', 'dishwasher', 'allows_large_dogs']
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deal_breakers JSONB DEFAULT '[]'::jsonb;
-- Example: ['no_ground_floor', 'no_studios', 'no_walk_ups']

-- Add documentation readiness
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_photo_id BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_proof_of_income BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_landlord_reference BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT false;

-- Add communication preferences
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'email'; -- 'text', 'email', 'phone', 'whatsapp'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS best_time_to_contact VARCHAR(50); -- 'morning', 'afternoon', 'evening', 'weekends'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS language_preference VARCHAR(20) DEFAULT 'en'; -- 'en', 'ru', 'es', etc.

-- Add lead scoring and qualification
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0; -- 0-15 scoring system
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lead_quality VARCHAR(20) DEFAULT 'unqualified'; -- 'hot', 'warm', 'cold', 'unqualified'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS qualification_status VARCHAR(30) DEFAULT 'new'; 
-- 'new', 'qualifying', 'qualified', 'viewing_scheduled', 'viewing_done', 'application_in_progress', 'approved', 'rejected'

-- Add viewing information
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS viewing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS viewing_property_id UUID REFERENCES properties(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS viewing_completed BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS viewing_feedback TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS interested_after_viewing BOOLEAN;

-- Add conversation metadata
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_ai_question TEXT; -- Track what AI last asked
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS qualification_progress JSONB DEFAULT '{}'::jsonb;
-- Example: {"financial": true, "timeline": true, "property_requirements": false, ...}

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Lead quality and scoring indexes
CREATE INDEX IF NOT EXISTS idx_tenants_lead_quality ON tenants(lead_quality) WHERE lead_quality IN ('hot', 'warm');
CREATE INDEX IF NOT EXISTS idx_tenants_lead_score ON tenants(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_tenants_qualification_status ON tenants(qualification_status);

-- Search and matching indexes
CREATE INDEX IF NOT EXISTS idx_tenants_budget ON tenants(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_tenants_move_in_date ON tenants(move_in_date);
CREATE INDEX IF NOT EXISTS idx_tenants_bedrooms ON tenants(bedrooms);
CREATE INDEX IF NOT EXISTS idx_tenants_property_type ON tenants(property_type);

-- Viewing management indexes
CREATE INDEX IF NOT EXISTS idx_tenants_viewing_date ON tenants(viewing_date) WHERE viewing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_viewing_property ON tenants(viewing_property_id) WHERE viewing_property_id IS NOT NULL;

-- JSONB GIN indexes for fast array searches
CREATE INDEX IF NOT EXISTS idx_tenants_required_amenities ON tenants USING GIN (required_amenities);
CREATE INDEX IF NOT EXISTS idx_tenants_preferred_neighborhoods ON tenants USING GIN (preferred_neighborhoods);
CREATE INDEX IF NOT EXISTS idx_tenants_must_haves ON tenants USING GIN (must_haves);

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON COLUMN tenants.budget_min IS 'Minimum monthly budget for rent';
COMMENT ON COLUMN tenants.budget_max IS 'Maximum monthly budget for rent';
COMMENT ON COLUMN tenants.credit_score IS 'Credit score category: excellent (750+), good (700-749), fair (650-699), poor (<650)';
COMMENT ON COLUMN tenants.lead_score IS 'Automated lead scoring 0-15 based on qualification criteria';
COMMENT ON COLUMN tenants.lead_quality IS 'Lead priority: hot (11-15), warm (6-10), cold (1-5), unqualified (0)';
COMMENT ON COLUMN tenants.qualification_status IS 'Current stage in the lead qualification workflow';
COMMENT ON COLUMN tenants.required_amenities IS 'Must-have amenities as JSON array';
COMMENT ON COLUMN tenants.preferred_amenities IS 'Nice-to-have amenities as JSON array';
COMMENT ON COLUMN tenants.must_haves IS 'Critical requirements that must be met';
COMMENT ON COLUMN tenants.deal_breakers IS 'Absolute no-gos that disqualify a property';
COMMENT ON COLUMN tenants.qualification_progress IS 'Tracks which qualification sections are complete';

-- =====================================================
-- HELPER FUNCTION: Calculate Lead Score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_lead_score(tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  tenant_record RECORD;
BEGIN
  SELECT * INTO tenant_record FROM tenants WHERE id = tenant_id;
  
  -- Budget match (0-3 points)
  IF tenant_record.budget_min IS NOT NULL AND tenant_record.budget_max IS NOT NULL THEN
    score := score + 3;
  ELSIF tenant_record.budget_min IS NOT NULL OR tenant_record.budget_max IS NOT NULL THEN
    score := score + 1;
  END IF;
  
  -- Credit score (0-3 points)
  CASE tenant_record.credit_score
    WHEN 'excellent' THEN score := score + 3;
    WHEN 'good' THEN score := score + 2;
    WHEN 'fair' THEN score := score + 1;
    ELSE score := score + 0;
  END CASE;
  
  -- Timeline urgency (0-2 points)
  IF tenant_record.move_in_date IS NOT NULL THEN
    IF tenant_record.move_in_date <= CURRENT_DATE + INTERVAL '2 weeks' THEN
      score := score + 2;
    ELSIF tenant_record.move_in_date <= CURRENT_DATE + INTERVAL '1 month' THEN
      score := score + 1;
    END IF;
  END IF;
  
  -- Documentation ready (0-2 points)
  IF tenant_record.has_proof_of_income AND tenant_record.has_landlord_reference THEN
    score := score + 2;
  ELSIF tenant_record.has_proof_of_income OR tenant_record.has_landlord_reference THEN
    score := score + 1;
  END IF;
  
  -- Property requirements specified (0-2 points)
  IF tenant_record.bedrooms IS NOT NULL AND tenant_record.property_type IS NOT NULL THEN
    score := score + 2;
  ELSIF tenant_record.bedrooms IS NOT NULL OR tenant_record.property_type IS NOT NULL THEN
    score := score + 1;
  END IF;
  
  -- Employment (0-2 points)
  CASE tenant_record.employment_status
    WHEN 'employed' THEN score := score + 2;
    WHEN 'self_employed' THEN score := score + 1;
    WHEN 'retired' THEN score := score + 1;
    ELSE score := score + 0;
  END CASE;
  
  -- Flexibility (0-1 point)
  IF tenant_record.deal_breakers IS NULL OR jsonb_array_length(tenant_record.deal_breakers) = 0 THEN
    score := score + 1;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: Update Lead Quality
-- =====================================================

CREATE OR REPLACE FUNCTION update_lead_quality(tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  score INTEGER;
  quality VARCHAR(20);
BEGIN
  score := calculate_lead_score(tenant_id);
  
  -- Update the lead_score
  UPDATE tenants SET lead_score = score WHERE id = tenant_id;
  
  -- Determine quality
  IF score >= 11 THEN
    quality := 'hot';
  ELSIF score >= 6 THEN
    quality := 'warm';
  ELSIF score >= 1 THEN
    quality := 'cold';
  ELSE
    quality := 'unqualified';
  END IF;
  
  -- Update the lead_quality
  UPDATE tenants SET lead_quality = quality WHERE id = tenant_id;
  
  RETURN quality;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update lead score on tenant update
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_lead_quality()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_lead_quality(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_lead_quality ON tenants;
CREATE TRIGGER auto_update_lead_quality
  AFTER INSERT OR UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_lead_quality();

-- =====================================================
-- GRANT permissions (if using RLS)
-- =====================================================

-- Users can view and update their own tenants
-- (Assuming RLS policies already exist for basic CRUD)

-- =====================================================
-- EXAMPLE DATA for testing
-- =====================================================

-- Example of a "hot" lead
/*
UPDATE tenants SET
  budget_min = 2000,
  budget_max = 2500,
  credit_score = 'excellent',
  employment_status = 'employed',
  move_in_date = CURRENT_DATE + INTERVAL '1 week',
  has_proof_of_income = true,
  has_landlord_reference = true,
  bedrooms = 2,
  property_type = 'apartment',
  urgency = 'high',
  required_amenities = '["laundry_in_unit", "doorman"]'::jsonb,
  must_haves = '["allows_pets", "dishwasher"]'::jsonb
WHERE id = '<some-tenant-id>';
*/

-- Run the score calculation
-- SELECT calculate_lead_score('<some-tenant-id>');
-- SELECT update_lead_quality('<some-tenant-id>');
