-- =====================================================
-- COMPREHENSIVE PROPERTY ENHANCEMENTS (Zillow-level)
-- =====================================================
-- This migration adds ALL fields necessary for AI-powered
-- property matching and detailed property information
-- =====================================================

-- ========== EXISTING FIELDS (Keep if not exists) ==========

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking VARCHAR(100) DEFAULT 'No parking';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS walk_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transit_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS lease_term VARCHAR(50) DEFAULT '12 months';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS internet_available BOOLEAN DEFAULT false;

-- ========== NEW HIGH-PRIORITY FIELDS ==========

-- Interior Details
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS flooring_type VARCHAR(50);
-- Options: 'Hardwood', 'Carpet', 'Tile', 'Laminate', 'Vinyl', 'Mixed'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS laundry_type VARCHAR(50);
-- Options: 'In Unit', 'Shared', 'Hookups Only', 'None'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS full_bathrooms INTEGER DEFAULT 0;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS half_bathrooms INTEGER DEFAULT 0;

-- Appliances & Kitchen
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS appliances TEXT[] DEFAULT ARRAY[]::TEXT[];
-- Example: ['Washer', 'Dryer', 'Dishwasher', 'Refrigerator', 'Oven', 'Microwave']

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS kitchen_features TEXT[] DEFAULT ARRAY[]::TEXT[];
-- Example: ['Fully Equipped', 'Island', 'Breakfast Bar', 'Pantry']

-- Parking Details
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS garage_type VARCHAR(50);
-- Options: 'Attached', 'Detached', 'Carport', 'None'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS garage_spaces INTEGER DEFAULT 0;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking_spaces_total INTEGER DEFAULT 0;

-- Building & Community
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS community_features TEXT[] DEFAULT ARRAY[]::TEXT[];
-- Example: ['Pool', 'Gym', 'Gated', 'Clubhouse', 'Tennis Court', 'Dog Park']

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS building_name VARCHAR(255);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS year_built INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_condition VARCHAR(50);
-- Options: 'New', 'Excellent', 'Good', 'Fair', 'Needs Work'

-- Heating & Cooling
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS heating_type VARCHAR(100);
-- Options: 'Central', 'Radiator', 'Forced Air', 'Electric', 'Gas'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cooling_type VARCHAR(100);
-- Options: 'Central AC', 'Window Units', 'Evaporative', 'None'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS air_conditioning BOOLEAN DEFAULT false;

-- Financial Details
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS security_deposit VARCHAR(100);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS pet_deposit VARCHAR(100);

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities_cost VARCHAR(100);
-- Example: '$300/month' or '$100-150/month'

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities_included TEXT[] DEFAULT ARRAY[]::TEXT[];
-- Example: ['Electricity', 'Water', 'Internet', 'Heat', 'Gas', 'Trash']

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS application_fee VARCHAR(100);

-- Availability
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS available_date DATE;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS move_in_date DATE;

-- Additional Scores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS bike_score INTEGER;

-- Pet Policy (JSONB for flexibility)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS pet_policy JSONB DEFAULT '{}'::jsonb;
-- Example: {
--   "allowed": true,
--   "types": ["Cats", "Small dogs"],
--   "deposit": "$500",
--   "monthly_fee": "$50",
--   "restrictions": "2 pets max, weight limit 25lbs"
-- }

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON COLUMN properties.parking IS 'Parking information (e.g., "2 spaces", "Street parking", "Attached garage")';
COMMENT ON COLUMN properties.walk_score IS 'Walk Score (0-100) - walkability rating';
COMMENT ON COLUMN properties.transit_score IS 'Transit Score (0-100) - public transit accessibility';
COMMENT ON COLUMN properties.bike_score IS 'Bike Score (0-100) - bikeability rating';
COMMENT ON COLUMN properties.lease_term IS 'Lease term duration (e.g., "12 months", "6 months", "Month-to-month")';
COMMENT ON COLUMN properties.utilities IS 'Array of utilities available';
COMMENT ON COLUMN properties.utilities_included IS 'Array of utilities included in rent';
COMMENT ON COLUMN properties.utilities_cost IS 'Cost of utilities if not included';
COMMENT ON COLUMN properties.internet_available IS 'Whether internet is available/included';
COMMENT ON COLUMN properties.flooring_type IS 'Type of flooring (Hardwood, Carpet, Tile, etc.)';
COMMENT ON COLUMN properties.furnished IS 'Whether the property comes furnished';
COMMENT ON COLUMN properties.laundry_type IS 'Type of laundry facility';
COMMENT ON COLUMN properties.full_bathrooms IS 'Number of full bathrooms (toilet+sink+shower/tub)';
COMMENT ON COLUMN properties.half_bathrooms IS 'Number of half bathrooms (toilet+sink only)';
COMMENT ON COLUMN properties.appliances IS 'Array of appliances included';
COMMENT ON COLUMN properties.kitchen_features IS 'Array of kitchen features';
COMMENT ON COLUMN properties.garage_type IS 'Type of garage (Attached, Detached, Carport, None)';
COMMENT ON COLUMN properties.garage_spaces IS 'Number of garage spaces';
COMMENT ON COLUMN properties.parking_spaces_total IS 'Total parking spaces available';
COMMENT ON COLUMN properties.community_features IS 'Array of community amenities';
COMMENT ON COLUMN properties.building_name IS 'Name of the building or complex';
COMMENT ON COLUMN properties.year_built IS 'Year the property was built';
COMMENT ON COLUMN properties.property_condition IS 'Overall condition of the property';
COMMENT ON COLUMN properties.heating_type IS 'Type of heating system';
COMMENT ON COLUMN properties.cooling_type IS 'Type of cooling system';
COMMENT ON COLUMN properties.air_conditioning IS 'Whether property has air conditioning';
COMMENT ON COLUMN properties.security_deposit IS 'Security deposit amount';
COMMENT ON COLUMN properties.pet_deposit IS 'Pet deposit amount';
COMMENT ON COLUMN properties.application_fee IS 'Application fee amount';
COMMENT ON COLUMN properties.available_date IS 'Date when property becomes available';
COMMENT ON COLUMN properties.move_in_date IS 'Actual move-in date';
COMMENT ON COLUMN properties.pet_policy IS 'Detailed pet policy information (JSON)';

-- ========== INDEXES FOR PERFORMANCE ==========

CREATE INDEX IF NOT EXISTS idx_properties_walk_score ON properties(walk_score) WHERE walk_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_transit_score ON properties(transit_score) WHERE transit_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_bike_score ON properties(bike_score) WHERE bike_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_lease_term ON properties(lease_term);
CREATE INDEX IF NOT EXISTS idx_properties_furnished ON properties(furnished);
CREATE INDEX IF NOT EXISTS idx_properties_available_date ON properties(available_date) WHERE available_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built) WHERE year_built IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_property_condition ON properties(property_condition);

-- Index for array searches
CREATE INDEX IF NOT EXISTS idx_properties_community_features ON properties USING GIN(community_features);
CREATE INDEX IF NOT EXISTS idx_properties_appliances ON properties USING GIN(appliances);
CREATE INDEX IF NOT EXISTS idx_properties_utilities_included ON properties USING GIN(utilities_included);

-- ========== SUCCESS MESSAGE ==========

DO $$
BEGIN
  RAISE NOTICE '✅ Property enhancements migration completed successfully!';
  RAISE NOTICE '📊 Added 30+ new fields for AI-powered property matching';
  RAISE NOTICE '🔍 Created 11 indexes for optimal query performance';
END $$;
