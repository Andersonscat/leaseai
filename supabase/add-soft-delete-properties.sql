-- Add soft delete support to properties table
-- This allows marking properties as deleted without removing them from the database

-- Add deleted_at column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at);

-- Add comment to explain the field
COMMENT ON COLUMN properties.deleted_at IS 'Timestamp when property was soft deleted. NULL means active.';
