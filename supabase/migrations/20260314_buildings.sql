-- ============================================================
-- Multi-Unit Building Support
-- ============================================================
-- Adds a buildings table and links properties to buildings
-- via building_id FK. Existing properties remain standalone
-- (building_id = NULL). Zero downtime, fully backward-compatible.
-- ============================================================

-- ─── 1. BUILDINGS TABLE ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS buildings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name               TEXT,
  address            TEXT NOT NULL,
  city               TEXT,
  state              VARCHAR(2),
  zip_code           VARCHAR(10),
  lat                DOUBLE PRECISION,
  lng                DOUBLE PRECISION,

  description        TEXT,
  type               TEXT CHECK (type IN ('apartment','condo','townhouse','co_living','mixed')),
  year_built         INTEGER,
  total_units        INTEGER,

  amenities          TEXT[],
  community_features TEXT[],
  rules              TEXT[],
  pet_policy         VARCHAR(50),
  parking_type       VARCHAR(50),
  laundry_type       VARCHAR(50),

  walk_score         INTEGER,
  transit_score      INTEGER,

  images             TEXT[],
  source_url         TEXT,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. PROPERTIES → BUILDINGS FK ───────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS building_id  UUID REFERENCES buildings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS unit_number  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS floor        INTEGER;

-- ─── 3. INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_buildings_user_id
  ON buildings(user_id);

CREATE INDEX IF NOT EXISTS idx_properties_building_id
  ON properties(building_id) WHERE building_id IS NOT NULL;

-- ─── 4. ROW LEVEL SECURITY ─────────────────────────────────

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own buildings"
  ON buildings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buildings"
  ON buildings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own buildings"
  ON buildings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own buildings"
  ON buildings FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 5. UPDATED_AT TRIGGER ─────────────────────────────────

CREATE TRIGGER update_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
