-- ============================================================
-- 1. Add 'thoughts' JSONB column (if missing)
-- ============================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thoughts JSONB DEFAULT NULL;

-- ============================================================
-- 2. Fix messages RLS: add direct user_id ownership check
--    Old policy only checked via properties/tenants JOINs,
--    which could miss messages without a property_id.
-- ============================================================
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;

CREATE POLICY "Users can view messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT p.user_id FROM properties p WHERE p.id = messages.property_id
      UNION
      SELECT t.user_id FROM tenants t WHERE t.id = messages.tenant_id
    )
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT p.user_id FROM properties p WHERE p.id = messages.property_id
      UNION
      SELECT t.user_id FROM tenants t WHERE t.id = messages.tenant_id
    )
  );

CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT p.user_id FROM properties p WHERE p.id = messages.property_id
      UNION
      SELECT t.user_id FROM tenants t WHERE t.id = messages.tenant_id
    )
  );

CREATE POLICY "Users can delete messages"
  ON messages FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT p.user_id FROM properties p WHERE p.id = messages.property_id
      UNION
      SELECT t.user_id FROM tenants t WHERE t.id = messages.tenant_id
    )
  );
