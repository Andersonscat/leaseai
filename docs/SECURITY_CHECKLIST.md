# 🔒 Чеклист безопасности - Проверьте перед использованием!

## ✅ Что нужно проверить

### 1. RLS (Row Level Security) включен в Supabase

**Способ 1: Через Dashboard**
1. Откройте Supabase Dashboard
2. Database → Tables → `properties`
3. Проверьте что **Enable RLS** ✅ включен

**Способ 2: Через SQL**
```sql
-- Проверка RLS статуса
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('properties', 'tenants', 'contracts', 'messages');

-- Результат должен показать rowsecurity = true
```

### 2. Применить RLS политики

Запустите в SQL Editor:

```sql
-- Файл: supabase/enable-rls.sql
-- Этот файл включает RLS и создает все политики
```

Или скопируйте сюда основные команды:

```sql
-- Включить RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Политики для properties
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Применить миграцию Soft Delete

Если еще не применили:

```sql
-- Файл: supabase/add-soft-delete-properties.sql
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at);
```

### 4. Проверить что всё работает

#### Тест 1: Создать property
1. Откройте приложение
2. Нажмите "+ Add New Property"
3. Заполните форму и сохраните
4. Проверьте, что property появился в списке

#### Тест 2: Проверить изоляцию пользователей
1. В Supabase SQL Editor:
```sql
-- Проверьте, что каждый property привязан к user_id
SELECT id, address, user_id, created_at 
FROM properties 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

#### Тест 3: Проверить что другие пользователи не видят ваши properties
1. Создайте второго тестового пользователя
2. Войдите под ним
3. Убедитесь, что он видит только свои properties

## ⚠️ Предупреждения

### ❌ НЕ ЗАПУСКАЙТЕ в продакшене:
```sql
-- supabase/disable-rls-for-testing.sql
-- Это отключает безопасность!
```

### ✅ Текущая защита

После всех исправлений у вас:

1. ✅ **API уровень**: фильтрация по `user_id`
2. ✅ **Database уровень**: RLS политики
3. ✅ **Soft Delete**: удаленные объекты не отображаются
4. ✅ **Ownership check**: только владелец может удалить/редактировать

## 🎯 Итоговый статус

- [x] API фильтрует по user_id
- [ ] RLS включен в Supabase (проверьте!)
- [ ] RLS политики применены (проверьте!)
- [x] Soft delete миграция создана
- [x] UI кнопки удаления добавлены
- [x] TypeScript типы обновлены

## 🚀 Готово к использованию

После выполнения всех пунктов выше:

**ДА! ✅** Ваши properties будут:
- Сохраняться в базе данных
- Видны только вам
- Защищены от доступа других пользователей
- Безопасно удаляться (soft delete)

---

**Важно**: Всегда проверяйте что RLS включен перед деплоем в продакшен!
