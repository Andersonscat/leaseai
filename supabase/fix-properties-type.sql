-- Fix properties not showing in UI
-- Problem: API filters by type='rent' but properties don't have type set

-- Check current state
SELECT 
  id,
  address,
  price,
  type,
  status,
  user_id
FROM properties
WHERE user_id = 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9'
ORDER BY created_at DESC;

-- Update all properties to have type='rent' if type is NULL or empty
UPDATE properties
SET type = 'rent'
WHERE user_id = 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9'
  AND (type IS NULL OR type = '');

-- Verify the update
SELECT 
  id,
  address,
  price,
  type,
  status
FROM properties
WHERE user_id = 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9'
ORDER BY created_at DESC;
