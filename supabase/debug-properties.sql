-- Check all properties in database
SELECT 
  id,
  address,
  price,
  beds,
  baths,
  type,
  status,
  deleted_at,
  created_at
FROM properties
WHERE user_id = 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9'
ORDER BY created_at DESC;

-- Check if there are duplicates by address
SELECT 
  address,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM properties
WHERE user_id = 'b8bfa36b-6d1c-4b9b-80e0-0c91a0363af9'
GROUP BY address
HAVING COUNT(*) > 1;
