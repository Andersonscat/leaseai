-- Add property_parameters JSONB column to properties table
-- This stores structured data (Groups A-K) with evidence and conflicts

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_parameters JSONB DEFAULT '{}'::jsonb;

-- Optional: Create GIN index for efficient JSON searching
CREATE INDEX IF NOT EXISTS idx_properties_parameters ON properties USING GIN (property_parameters);

-- Backfill example (optional, can be run manually):
-- UPDATE properties 
-- SET property_parameters = jsonb_build_object(
--   'identity', jsonb_build_object('address', address, 'type', type),
--   'pricing', jsonb_build_object('rent', price),
--   'layout', jsonb_build_object('beds', beds, 'baths', baths, 'sqft', sqft)
-- )
-- WHERE property_parameters = '{}'::jsonb;
