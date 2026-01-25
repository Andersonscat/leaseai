-- =====================================================
-- ENHANCED PROPERTY FIELDS MIGRATION
-- =====================================================
-- Adds the new property fields that match the application code
-- =====================================================

-- Add parking information (string field)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking VARCHAR(100) DEFAULT 'No parking';

-- Add location and neighborhood scores
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS walk_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transit_score INTEGER;

-- Add lease term information
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS lease_term VARCHAR(50) DEFAULT '12 months';

-- Add utilities as array of strings
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add internet availability
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS internet_available BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN properties.parking IS 'Parking information (e.g., "2 spaces", "Street parking", "No parking")';
COMMENT ON COLUMN properties.walk_score IS 'Walk Score (0-100) - walkability rating';
COMMENT ON COLUMN properties.transit_score IS 'Transit Score (0-100) - public transit accessibility';
COMMENT ON COLUMN properties.lease_term IS 'Lease term duration (e.g., "12 months", "6 months", "Month-to-month")';
COMMENT ON COLUMN properties.utilities IS 'Array of utilities included (e.g., water, electricity, gas, internet)';
COMMENT ON COLUMN properties.internet_available IS 'Whether internet is available/included';

-- Create index on scores for filtering
CREATE INDEX IF NOT EXISTS idx_properties_walk_score ON properties(walk_score);
CREATE INDEX IF NOT EXISTS idx_properties_transit_score ON properties(transit_score);
CREATE INDEX IF NOT EXISTS idx_properties_lease_term ON properties(lease_term);
