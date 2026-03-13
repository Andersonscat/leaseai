-- Migration: Drop unused/dead columns from properties table
--
-- price_amount: superseded by price_monthly, never written by app
-- amenities_normalized: only used in debug sandbox, not production
-- lease_term_min: written but never read back
-- furnished: written but never read (AI checks features text instead)
-- laundry_type: written but never read
-- property_parameters: JSONB written by extract route but never displayed
-- parking_available: ghost column (no migration ever created it, was written but ignored by Supabase)

ALTER TABLE properties
  DROP COLUMN IF EXISTS price_amount,
  DROP COLUMN IF EXISTS amenities_normalized,
  DROP COLUMN IF EXISTS lease_term_min,
  DROP COLUMN IF EXISTS furnished,
  DROP COLUMN IF EXISTS laundry_type,
  DROP COLUMN IF EXISTS property_parameters,
  DROP COLUMN IF EXISTS parking_available;

-- Also drop the GIN index on property_parameters if it exists
DROP INDEX IF EXISTS idx_properties_parameters;
DROP INDEX IF EXISTS idx_properties_amenities_normalized;
