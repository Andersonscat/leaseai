-- Migration: Add granular address fields to properties table
-- Date: 2026-01-30

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN properties.city IS 'City where the property is located';
COMMENT ON COLUMN properties.state IS 'State/Province where the property is located';
COMMENT ON COLUMN properties.zip_code IS 'ZIP or Postal code of the property';
