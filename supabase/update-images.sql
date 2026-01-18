-- Update image URLs to include ?w=800 parameter

-- Update properties images
UPDATE properties 
SET images = ARRAY(
  SELECT CASE 
    WHEN url LIKE '%?%' THEN url 
    ELSE url || '?w=800' 
  END
  FROM unnest(images) AS url
)
WHERE images IS NOT NULL;

-- Verify update
SELECT id, address, images FROM properties LIMIT 3;
