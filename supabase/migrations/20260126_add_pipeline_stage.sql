-- Migration to add pipeline_stage to tenants table
-- Run this via Supabase Query Editor

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'New Lead';

-- Optional: Create an index for faster filtering by stage
CREATE INDEX IF NOT EXISTS idx_tenants_pipeline_stage ON tenants(pipeline_stage);

-- Optional: Update existing records based on status if needed
-- UPDATE tenants SET pipeline_stage = 'Signed' WHERE status = 'Current';
