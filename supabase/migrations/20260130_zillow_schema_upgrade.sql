-- Migration: Upgrade properties table with Zillow data model fields
-- Date: 2026-01-30

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS available_from DATE,
ADD COLUMN IF NOT EXISTS lease_term_min INTEGER, -- Minimum lease duration in months
ADD COLUMN IF NOT EXISTS application_fee INTEGER,
ADD COLUMN IF NOT EXISTS security_deposit INTEGER,
ADD COLUMN IF NOT EXISTS price_amount INTEGER, -- Numeric price for range queries
ADD COLUMN IF NOT EXISTS utilities_fee INTEGER, -- Estimated monthly utilities cost
ADD COLUMN IF NOT EXISTS utilities_included TEXT[], -- Array of included utilities e.g. ['Water', 'Internet']
ADD COLUMN IF NOT EXISTS pet_policy VARCHAR(50), -- 'allowed', 'cats_only', 'small_dogs', 'no_pets'
ADD COLUMN IF NOT EXISTS pet_fee INTEGER, -- Monthly pet rent
ADD COLUMN IF NOT EXISTS pet_deposit INTEGER, -- One-time pet deposit
ADD COLUMN IF NOT EXISTS parking_type VARCHAR(50), -- 'garage', 'street', 'carport', 'none'
ADD COLUMN IF NOT EXISTS parking_fee INTEGER, -- Monthly parking cost
ADD COLUMN IF NOT EXISTS laundry_type VARCHAR(50), -- 'in_unit', 'shared', 'hookups', 'none'
ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN properties.available_from IS 'Date when the property becomes available for move-in';
COMMENT ON COLUMN properties.price_amount IS 'Numeric rent price for filtering and sorting';
COMMENT ON COLUMN properties.pet_policy IS 'Structured pet policy enum: allowed, cats_only, small_dogs, no_pets';
