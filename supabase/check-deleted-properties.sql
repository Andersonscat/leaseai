-- ============================================
-- ПРОВЕРКА SOFT DELETE
-- ============================================
-- Этот скрипт показывает все properties включая удаленные

-- 1. Посмотреть все properties с их статусом
SELECT 
  id,
  address,
  price,
  deleted_at,
  CASE 
    WHEN deleted_at IS NULL THEN '✅ Active'
    ELSE '🗑️ Deleted on ' || deleted_at::date
  END as status,
  created_at::date as created
FROM properties
ORDER BY deleted_at DESC NULLS LAST, created_at DESC;

-- 2. Статистика
SELECT 
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
  COUNT(*) as total_count
FROM properties;

-- 3. Недавно удаленные (последние 7 дней)
SELECT 
  id,
  address,
  deleted_at,
  deleted_at::date as deleted_date,
  NOW() - deleted_at as time_since_delete
FROM properties
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '7 days'
ORDER BY deleted_at DESC;

-- ============================================
-- КАК ВОССТАНОВИТЬ
-- ============================================

-- Восстановить конкретный property (замените ID)
-- UPDATE properties SET deleted_at = NULL WHERE id = 'property-id-here';

-- Восстановить все удаленные сегодня
-- UPDATE properties SET deleted_at = NULL WHERE deleted_at::date = CURRENT_DATE;

-- ============================================
-- HARD DELETE (ОПАСНО!)
-- ============================================

-- Удалить НАВСЕГДА properties старше 30 дней
-- ВНИМАНИЕ: Это необратимо!
-- DELETE FROM properties 
-- WHERE deleted_at IS NOT NULL 
--   AND deleted_at < NOW() - INTERVAL '30 days';
