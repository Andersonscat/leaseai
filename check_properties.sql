-- Проверка properties в базе
SELECT 
  id,
  address,
  price,
  beds as bedrooms,
  status,
  user_id,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 5;
