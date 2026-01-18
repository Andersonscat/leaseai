-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
-- This ensures each user can only see their own data

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interested_tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP OLD POLICIES (if any exist)
-- ============================================

DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

DROP POLICY IF EXISTS "Users can view own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete own tenants" ON tenants;

DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;

DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;

DROP POLICY IF EXISTS "Users can view interested tenants" ON interested_tenants;
DROP POLICY IF EXISTS "Users can insert interested tenants" ON interested_tenants;
DROP POLICY IF EXISTS "Users can delete interested tenants" ON interested_tenants;

-- ============================================
-- PROPERTIES TABLE POLICIES
-- ============================================

-- Users can view their own properties
CREATE POLICY "Users can view own properties"
  ON properties
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own properties
CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own properties
CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own properties
CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TENANTS TABLE POLICIES
-- ============================================

-- Users can view their own tenants
CREATE POLICY "Users can view own tenants"
  ON tenants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tenants
CREATE POLICY "Users can insert own tenants"
  ON tenants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tenants
CREATE POLICY "Users can update own tenants"
  ON tenants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tenants
CREATE POLICY "Users can delete own tenants"
  ON tenants
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CONTRACTS TABLE POLICIES
-- ============================================

-- Users can view their own contracts
CREATE POLICY "Users can view own contracts"
  ON contracts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own contracts
CREATE POLICY "Users can insert own contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own contracts
CREATE POLICY "Users can update own contracts"
  ON contracts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contracts
CREATE POLICY "Users can delete own contracts"
  ON contracts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages related to their properties or where they are the tenant
CREATE POLICY "Users can view messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = messages.property_id
      UNION
      SELECT user_id FROM tenants WHERE id = messages.tenant_id
    )
  );

-- Users can insert messages for their properties or as a tenant
CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = messages.property_id
      UNION
      SELECT user_id FROM tenants WHERE id = messages.tenant_id
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update messages"
  ON messages
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = messages.property_id
      UNION
      SELECT user_id FROM tenants WHERE id = messages.tenant_id
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete messages"
  ON messages
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = messages.property_id
      UNION
      SELECT user_id FROM tenants WHERE id = messages.tenant_id
    )
  );

-- ============================================
-- INTERESTED_TENANTS TABLE POLICIES
-- ============================================

-- Users can view interested tenants for their properties
CREATE POLICY "Users can view interested tenants"
  ON interested_tenants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = interested_tenants.property_id
    )
  );

-- Users can insert interested tenants
CREATE POLICY "Users can insert interested tenants"
  ON interested_tenants
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = interested_tenants.property_id
    )
  );

-- Users can delete interested tenants from their properties
CREATE POLICY "Users can delete interested tenants"
  ON interested_tenants
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM properties WHERE id = interested_tenants.property_id
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('properties', 'tenants', 'contracts', 'messages', 'interested_tenants');

-- Check policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
