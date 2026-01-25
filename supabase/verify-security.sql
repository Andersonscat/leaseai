-- ============================================
-- VERIFY SECURITY SETUP
-- ============================================
-- Запустите этот скрипт чтобы проверить что всё настроено правильно

-- 1. Проверка что RLS включен
SELECT 
  '✅ RLS Status' as check_name,
  tablename, 
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED - FIX THIS!' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('properties', 'tenants', 'contracts', 'messages', 'interested_tenants')
ORDER BY tablename;

-- 2. Проверка что политики существуют
SELECT 
  '✅ RLS Policies' as check_name,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ OK (4+ policies)' 
    ELSE '⚠️ WARNING: Expected 4+ policies' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'tenants', 'contracts')
GROUP BY tablename
ORDER BY tablename;

-- 3. Проверка что deleted_at колонка существует
SELECT 
  '✅ Soft Delete Column' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'deleted_at' THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.columns
WHERE table_name = 'properties' 
  AND column_name = 'deleted_at';

-- 4. Проверка индексов
SELECT 
  '✅ Indexes' as check_name,
  indexname,
  '✅ EXISTS' as status
FROM pg_indexes
WHERE tablename = 'properties'
  AND indexname IN ('idx_properties_user_id', 'idx_properties_deleted_at')
ORDER BY indexname;

-- 5. Проверка текущих properties (только ваши)
SELECT 
  '✅ Your Properties' as check_name,
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_properties,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_properties
FROM properties
WHERE user_id = auth.uid();

-- ============================================
-- EXPECTED RESULTS
-- ============================================
/*
Если всё настроено правильно, вы должны увидеть:

1. RLS Status:
   - properties: ✅ ENABLED
   - tenants: ✅ ENABLED
   - contracts: ✅ ENABLED
   - messages: ✅ ENABLED

2. RLS Policies:
   - properties: ✅ OK (4+ policies)
   - tenants: ✅ OK (4+ policies)
   - contracts: ✅ OK (4+ policies)

3. Soft Delete Column:
   - deleted_at: ✅ EXISTS

4. Indexes:
   - idx_properties_user_id: ✅ EXISTS
   - idx_properties_deleted_at: ✅ EXISTS

5. Your Properties:
   - Показывает количество ваших properties

ЕСЛИ ЧТО-ТО ПОКАЗЫВАЕТ ❌:
  → Запустите соответствующий файл миграции:
     - supabase/enable-rls.sql (для RLS)
     - supabase/add-soft-delete-properties.sql (для soft delete)
*/
