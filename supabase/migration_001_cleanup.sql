-- ============================================================
-- LeaseAI — Properties Table Migration v2 (defensive)
-- Safe to run: each block checks column existence first.
-- ============================================================

-- ─── 1. PRICE ─────────────────────────────────────────────
-- Create price_monthly (int4) from price (varchar), drop price

DO $$
BEGIN
  -- Add price_monthly if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='price_monthly'
  ) THEN
    ALTER TABLE properties ADD COLUMN price_monthly INTEGER;
  END IF;

  -- Migrate from price_amount (int4) if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='price_amount'
  ) THEN
    UPDATE properties
    SET price_monthly = price_amount
    WHERE price_monthly IS NULL AND price_amount IS NOT NULL;

    ALTER TABLE properties DROP COLUMN price_amount;
  END IF;

  -- Migrate from price (varchar) if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='price'
  ) THEN
    UPDATE properties
    SET price_monthly = NULLIF(REGEXP_REPLACE(price::text, '[^0-9]', '', 'g'), '')::integer
    WHERE price_monthly IS NULL AND price IS NOT NULL AND price::text != '';

    ALTER TABLE properties DROP COLUMN price;
  END IF;
END $$;

-- ─── 2. SQFT ──────────────────────────────────────────────
-- sqft (varchar) → sqft (integer)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='sqft'
      AND data_type IN ('character varying', 'text')
  ) THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS sqft_new INTEGER;
    UPDATE properties
    SET sqft_new = NULLIF(REGEXP_REPLACE(sqft::text, '[^0-9]', '', 'g'), '')::integer
    WHERE sqft IS NOT NULL AND sqft::text != '';
    ALTER TABLE properties DROP COLUMN sqft;
    ALTER TABLE properties RENAME COLUMN sqft_new TO sqft;
  END IF;
END $$;

-- ─── 3. SECURITY_DEPOSIT ─────────────────────────────────
-- security_deposit (varchar) → security_deposit (integer)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='security_deposit'
      AND data_type IN ('character varying', 'text')
  ) THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit_new INTEGER;
    UPDATE properties
    SET security_deposit_new = NULLIF(REGEXP_REPLACE(security_deposit::text, '[^0-9]', '', 'g'), '')::integer
    WHERE security_deposit IS NOT NULL AND security_deposit::text != '';
    ALTER TABLE properties DROP COLUMN security_deposit;
    ALTER TABLE properties RENAME COLUMN security_deposit_new TO security_deposit;
  END IF;
END $$;

-- ─── 4. APPLICATION_FEE ──────────────────────────────────
-- application_fee (varchar) → application_fee (integer)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='application_fee'
      AND data_type IN ('character varying', 'text')
  ) THEN
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS application_fee_new INTEGER;
    UPDATE properties
    SET application_fee_new = NULLIF(REGEXP_REPLACE(application_fee::text, '[^0-9]', '', 'g'), '')::integer
    WHERE application_fee IS NOT NULL AND application_fee::text != '';
    ALTER TABLE properties DROP COLUMN application_fee;
    ALTER TABLE properties RENAME COLUMN application_fee_new TO application_fee;
  END IF;
END $$;

-- ─── 5. AVAILABLE_DATE → available_from ──────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='available_date'
  ) THEN
    UPDATE properties
    SET available_from = available_date
    WHERE available_from IS NULL AND available_date IS NOT NULL;
    ALTER TABLE properties DROP COLUMN available_date;
  END IF;
END $$;

-- ─── 6. PARKING legacy varchar ───────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='parking'
  ) THEN
    UPDATE properties
    SET
      parking_type = COALESCE(parking_type, parking),
      parking_available = CASE
        WHEN parking_available IS NULL
         AND parking IS NOT NULL
         AND lower(parking) NOT IN ('none','no','')
        THEN TRUE ELSE parking_available END
    WHERE parking IS NOT NULL AND parking != '';
    ALTER TABLE properties DROP COLUMN parking;
  END IF;
END $$;

-- ─── 7. UTILITIES duplicate ──────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='utilities'
  ) THEN
    UPDATE properties
    SET utilities_included = utilities
    WHERE utilities_included IS NULL AND utilities IS NOT NULL;
    ALTER TABLE properties DROP COLUMN utilities;
  END IF;
END $$;

-- ─── 8. PETS legacy varchar → pet_policy jsonb ───────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='pets'
  ) THEN
    UPDATE properties
    SET pet_policy = jsonb_build_object(
      'allowed', CASE
        WHEN lower(pets::text) ~ 'allow|yes|ok|permit' THEN true
        WHEN lower(pets::text) ~ 'no pets|not allow|not permit' THEN false
        ELSE NULL END,
      'notes', pets)
    WHERE pet_policy IS NULL AND pets IS NOT NULL AND pets::text != '';
    ALTER TABLE properties DROP COLUMN pets;
  END IF;
END $$;

-- ─── 9. TYPE constraint ──────────────────────────────────

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_type_check
  CHECK (type IN ('apartment','house','condo','townhouse','studio','loft','rent','sale'));

COMMIT;

-- ─── Verify: show final column list ──────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;


