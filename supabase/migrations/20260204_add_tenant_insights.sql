-- Add AI insight fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS budget_max NUMERIC,
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS pet_details TEXT,
ADD COLUMN IF NOT EXISTS lead_priority VARCHAR(20) DEFAULT 'warm' CHECK (lead_priority IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;

-- Add comment to explain the fields
COMMENT ON COLUMN tenants.ai_summary IS 'AI-generated summary of the lead intentions and needs';
COMMENT ON COLUMN tenants.budget_max IS 'Extracted maximum budget from conversation';
COMMENT ON COLUMN tenants.move_in_date IS 'Extracted desired move-in date';
COMMENT ON COLUMN tenants.pet_details IS 'Information about pets extracted from conversation';
COMMENT ON COLUMN tenants.lead_priority IS 'Lead quality assessment by AI (hot, warm, cold)';
