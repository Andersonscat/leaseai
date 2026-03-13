-- Migration: Drop unused columns from tenants table
-- These fields were never read or written by application code.

ALTER TABLE tenants
  DROP COLUMN IF EXISTS lease_start,
  DROP COLUMN IF EXISTS lease_end,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS emergency_contact,
  DROP COLUMN IF EXISTS id_verified;
