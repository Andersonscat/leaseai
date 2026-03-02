-- Migration: Normalize amenities to standardized catalog keys
-- Adds amenities_normalized TEXT[] column alongside existing free-text amenities/features

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS amenities_normalized TEXT[] DEFAULT '{}';

-- Index for fast amenity filtering
CREATE INDEX IF NOT EXISTS idx_properties_amenities_normalized
  ON properties USING GIN (amenities_normalized);

-- Normalization function: maps free-text → canonical keys
CREATE OR REPLACE FUNCTION normalize_amenity_text(raw TEXT)
RETURNS TEXT AS $$
DECLARE
  lower_raw TEXT := lower(trim(raw));
BEGIN
  -- Appliances
  IF lower_raw ILIKE '%dishwasher%'                                  THEN RETURN 'dishwasher'; END IF;
  IF lower_raw ILIKE '%in-unit%laundry%'
  OR lower_raw ILIKE '%in unit%washer%'
  OR lower_raw ILIKE '%washer%dryer%in%unit%'
  OR lower_raw ILIKE '%in-unit washer%'                              THEN RETURN 'washer_dryer_inunit'; END IF;
  IF lower_raw ILIKE '%washer%dryer%hookup%'
  OR lower_raw ILIKE '%w/d hookup%'                                  THEN RETURN 'washer_dryer_hookup'; END IF;
  IF lower_raw ILIKE '%microwave%'                                   THEN RETURN 'microwave'; END IF;
  IF lower_raw ILIKE '%refrigerator%' OR lower_raw ILIKE '%fridge%' THEN RETURN 'refrigerator'; END IF;
  IF lower_raw ILIKE '%stainless steel appliances%'
  OR lower_raw ILIKE '%oven%' OR lower_raw ILIKE '%stove%'          THEN RETURN 'oven_stove'; END IF;
  IF lower_raw ILIKE '%garbage disposal%'                            THEN RETURN 'garbage_disposal'; END IF;
  IF lower_raw ILIKE '%smart tv%' OR lower_raw ILIKE '% tv%'
  OR lower_raw ILIKE '%television%' OR lower_raw ILIKE '%flatscreen%' THEN RETURN 'tv'; END IF;
  IF lower_raw ILIKE '%fully furnished%' OR lower_raw ILIKE '%furnished%' THEN RETURN 'furnished'; END IF;

  -- Climate
  IF lower_raw ILIKE '%central ac%' OR lower_raw ILIKE '%central air%'
  OR lower_raw ILIKE '%central a/c%'                                THEN RETURN 'ac_central'; END IF;
  IF lower_raw ILIKE '%window ac%' OR lower_raw ILIKE '%window unit%' THEN RETURN 'ac_window'; END IF;
  IF lower_raw ILIKE '%radiator%' OR lower_raw ILIKE '%radiant heat%' THEN RETURN 'radiant_heat'; END IF;
  IF lower_raw ILIKE '%forced air%' OR lower_raw ILIKE '%central heat%' THEN RETURN 'forced_air_heat'; END IF;
  IF lower_raw ILIKE '%ceiling fan%'                                 THEN RETURN 'ceiling_fan'; END IF;
  IF lower_raw ILIKE '%fireplace%'                                   THEN RETURN 'fireplace'; END IF;

  -- Space
  IF lower_raw ILIKE '%private balcony%' OR lower_raw ILIKE '%balcony%' THEN RETURN 'balcony'; END IF;
  IF lower_raw ILIKE '%terrace%'                                     THEN RETURN 'terrace'; END IF;
  IF lower_raw ILIKE '%patio%'                                       THEN RETURN 'patio'; END IF;
  IF lower_raw ILIKE '%backyard%' OR lower_raw ILIKE '%private yard%' OR lower_raw ILIKE '%yard%' THEN RETURN 'yard'; END IF;
  IF lower_raw ILIKE '%walk-in closet%' OR lower_raw ILIKE '%walk in closet%' THEN RETURN 'walk_in_closet'; END IF;
  IF lower_raw ILIKE '%den%' OR lower_raw ILIKE '%home office%' OR lower_raw ILIKE '%office%' THEN RETURN 'den_office'; END IF;
  IF lower_raw ILIKE '%storage%'                                     THEN RETURN 'storage_unit'; END IF;
  IF lower_raw ILIKE '%hardwood%'                                    THEN RETURN 'hardwood_floors'; END IF;
  IF lower_raw ILIKE '%high ceiling%' OR lower_raw ILIKE '%floor-to-ceiling%'
  OR lower_raw ILIKE '%floor to ceiling%'                           THEN RETURN 'high_ceilings'; END IF;

  -- Building
  IF lower_raw ILIKE '%gym%' OR lower_raw ILIKE '%fitness%'         THEN RETURN 'gym'; END IF;
  IF lower_raw ILIKE '%pool%'                                        THEN RETURN 'pool'; END IF;
  IF lower_raw ILIKE '%hot tub%' OR lower_raw ILIKE '%jacuzzi%' OR lower_raw ILIKE '%sauna%' THEN RETURN 'hot_tub'; END IF;
  IF lower_raw ILIKE '%rooftop%' OR lower_raw ILIKE '%roof deck%'   THEN RETURN 'rooftop_deck'; END IF;
  IF lower_raw ILIKE '%doorman%'                                     THEN RETURN 'doorman'; END IF;
  IF lower_raw ILIKE '%concierge%'                                   THEN RETURN 'concierge'; END IF;
  IF lower_raw ILIKE '%package%'                                     THEN RETURN 'package_room'; END IF;
  IF lower_raw ILIKE '%bike%'                                        THEN RETURN 'bike_storage'; END IF;
  IF lower_raw ILIKE '%coworking%' OR lower_raw ILIKE '%co-working%'
  OR lower_raw ILIKE '%business center%'                            THEN RETURN 'coworking_lounge'; END IF;
  IF lower_raw ILIKE '%elevator%'                                    THEN RETURN 'elevator'; END IF;
  IF lower_raw ILIKE '%shared laundry%' OR lower_raw ILIKE '%laundry room%'
  OR lower_raw ILIKE '%coin laundry%'                               THEN RETURN 'laundry_in_building'; END IF;

  -- Parking
  IF lower_raw ILIKE '%garage%'                                      THEN RETURN 'parking_garage'; END IF;
  IF lower_raw ILIKE '%parking lot%' OR lower_raw ILIKE '%surface parking%' THEN RETURN 'parking_surface'; END IF;
  IF lower_raw ILIKE '%street parking%'                              THEN RETURN 'parking_street'; END IF;
  IF lower_raw ILIKE '%ev charging%' OR lower_raw ILIKE '%electric vehicle%' THEN RETURN 'ev_charging'; END IF;

  -- Connectivity
  IF lower_raw ILIKE '%fiber%'                                       THEN RETURN 'fiber_internet'; END IF;
  IF lower_raw ILIKE '%internet included%' OR lower_raw ILIKE '%wifi included%' THEN RETURN 'internet_included'; END IF;
  IF lower_raw ILIKE '%cable%'                                       THEN RETURN 'cable_ready'; END IF;

  -- Views
  IF lower_raw ILIKE '%city view%' OR lower_raw ILIKE '%skyline%'   THEN RETURN 'city_view'; END IF;
  IF lower_raw ILIKE '%water view%' OR lower_raw ILIKE '%ocean view%'
  OR lower_raw ILIKE '%lake view%'                                  THEN RETURN 'water_view'; END IF;
  IF lower_raw ILIKE '%mountain view%'                               THEN RETURN 'mountain_view'; END IF;

  -- Security
  IF lower_raw ILIKE '%key fob%' OR lower_raw ILIKE '%secure entry%' THEN RETURN 'key_fob_access'; END IF;
  IF lower_raw ILIKE '%intercom%'                                    THEN RETURN 'intercom'; END IF;
  IF lower_raw ILIKE '%security camera%' OR lower_raw ILIKE '%cctv%' THEN RETURN 'security_cameras'; END IF;

  -- Pet
  IF lower_raw ILIKE '%pet friendly%' OR lower_raw ILIKE '%pets allowed%' THEN RETURN 'pet_friendly'; END IF;
  IF lower_raw ILIKE '%dog park%' OR lower_raw ILIKE '%dog run%'     THEN RETURN 'dog_park'; END IF;

  RETURN NULL; -- unrecognized
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill: normalize existing features + amenities arrays for all properties
UPDATE properties
SET amenities_normalized = (
  SELECT array_agg(DISTINCT normalized) FILTER (WHERE normalized IS NOT NULL)
  FROM (
    SELECT normalize_amenity_text(unnest(
      COALESCE(features, '{}') || COALESCE(amenities, '{}')
    )) AS normalized
  ) sub
)
WHERE features IS NOT NULL OR amenities IS NOT NULL;

-- Trigger: auto-normalize whenever features or amenities change
CREATE OR REPLACE FUNCTION trigger_normalize_amenities()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amenities_normalized := (
    SELECT array_agg(DISTINCT normalized) FILTER (WHERE normalized IS NOT NULL)
    FROM (
      SELECT normalize_amenity_text(unnest(
        COALESCE(NEW.features, '{}') || COALESCE(NEW.amenities, '{}')
      )) AS normalized
    ) sub
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_amenities ON properties;
CREATE TRIGGER trg_normalize_amenities
  BEFORE INSERT OR UPDATE OF features, amenities
  ON properties
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_amenities();
