-- =====================================================
-- ENHANCED PROPERTY INFORMATION FIELDS
-- =====================================================
-- This migration adds comprehensive property details
-- to make property listings more informative (Zillow-style)
-- =====================================================

-- Add parking information
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking_available BOOLEAN DEFAULT false;

-- Add location and neighborhood scores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS walk_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transit_score INTEGER;

-- Add lease and utilities information
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS lease_term VARCHAR(50); -- '12 months', '6 months', 'month-to-month', 'flexible'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities_included JSONB DEFAULT '[]'::jsonb;
-- Example: ['water', 'heat', 'electricity', 'internet', 'trash']

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS available_date DATE;

-- Add property age and condition
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS year_built INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_condition VARCHAR(50); -- 'new', 'excellent', 'good', 'fair', 'needs_work'

-- Add flooring and interior details
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS flooring_type VARCHAR(100); -- 'hardwood', 'carpet', 'tile', 'mixed'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS appliances_included JSONB DEFAULT '[]'::jsonb;
-- Example: ['refrigerator', 'oven', 'dishwasher', 'microwave', 'washer', 'dryer']

-- Add heating and cooling
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS heating_type VARCHAR(100); -- 'central', 'radiator', 'forced_air', 'electric'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cooling_type VARCHAR(100); -- 'central_ac', 'window_units', 'none'

-- Add building information (for apartments)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS building_name VARCHAR(255);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS floor_number INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS total_floors INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);

-- Add contact and viewing information
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS video_tour_url TEXT;

-- Add deposit and fees
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS security_deposit VARCHAR(100);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS application_fee VARCHAR(100);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS pet_deposit VARCHAR(100);

-- Add neighborhood details (JSONB for flexibility)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS nearby_places JSONB DEFAULT '{}'::jsonb;
-- Example: {
--   "grocery": "5 min walk",
--   "downtown": "10 min drive",
--   "park": "2 min walk",
--   "public_transit": "3 min walk",
--   "hospital": "15 min drive",
--   "schools": "10 min walk"
-- }

-- Comments for documentation
COMMENT ON COLUMN properties.parking_available IS 'Whether parking is available with the property';
COMMENT ON COLUMN properties.walk_score IS 'Walk Score (0-100) - walkability rating';
COMMENT ON COLUMN properties.transit_score IS 'Transit Score (0-100) - public transit accessibility';
COMMENT ON COLUMN properties.utilities_included IS 'Array of utilities included in rent';
COMMENT ON COLUMN properties.available_date IS 'Date when property becomes available';
COMMENT ON COLUMN properties.appliances_included IS 'Array of appliances included with property';
COMMENT ON COLUMN properties.nearby_places IS 'JSON object with distances to nearby amenities';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_updated_at ON properties;

CREATE TRIGGER properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_properties_updated_at();
