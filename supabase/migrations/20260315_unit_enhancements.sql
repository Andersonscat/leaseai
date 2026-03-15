-- ============================================================
-- Unit-Level Enhancements
-- ============================================================
-- Adds floor_plan_name and move_in_special to properties.
-- All other per-unit fields (floor, images, amenities, features,
-- description, furnished, lease_term, security_deposit, etc.)
-- already exist on the properties table.
-- ============================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plan_name VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS move_in_special TEXT;
