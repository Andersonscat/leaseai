-- Remove duplicate tenants (keep the oldest one)
-- This script identifies duplicate tenants by email and merges them

-- Step 1: Show duplicates (for review)
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id) as tenant_ids,
  array_agg(created_at) as created_dates
FROM tenants
GROUP BY user_id, LOWER(email)
HAVING COUNT(*) > 1;

-- Step 2: For each duplicate, keep the oldest and merge messages to it
-- (Run this carefully - it will delete duplicates!)

WITH duplicates AS (
  SELECT 
    id,
    email,
    user_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(email) 
      ORDER BY created_at ASC
    ) as rn
  FROM tenants
)
-- Update messages to point to the oldest tenant
UPDATE messages m
SET tenant_id = (
  SELECT id 
  FROM duplicates 
  WHERE rn = 1 
    AND LOWER(duplicates.email) = LOWER((SELECT email FROM tenants WHERE id = m.tenant_id))
    AND duplicates.user_id = (SELECT user_id FROM tenants WHERE id = m.tenant_id)
)
WHERE tenant_id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Delete duplicate tenants (keep only the oldest one)
WITH duplicates AS (
  SELECT 
    id,
    email,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(email) 
      ORDER BY created_at ASC
    ) as rn
  FROM tenants
)
DELETE FROM tenants
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 4: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_user_email_unique 
ON tenants(user_id, LOWER(email));
