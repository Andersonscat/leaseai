-- Add parking column to properties table
-- Run this in Supabase SQL Editor

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking VARCHAR(100);

-- Optional: Set default value for existing properties
UPDATE properties 
SET parking = 'No parking' 
WHERE parking IS NULL;
