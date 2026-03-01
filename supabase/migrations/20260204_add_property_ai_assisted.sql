-- Migration: Add AI assisted toggle to properties table
-- This allows landlords to enable/disable AI responses per property

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ai_assisted BOOLEAN DEFAULT true;

-- Update all existing properties to have AI assisted enabled by default
UPDATE properties SET ai_assisted = true WHERE ai_assisted IS NULL;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_properties_ai_assisted ON properties (ai_assisted);

COMMENT ON COLUMN properties.ai_assisted IS 'Whether AI assistant is enabled for inquiries about this property';
