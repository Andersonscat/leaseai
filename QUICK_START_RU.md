# 🚀 Быстрый старт - Properties сохранение и удаление

## ✅ Что было исправлено

### Проблема
- ❌ GET запрос возвращал ВСЕ properties всех пользователей
- ❌ Любой пользователь мог видеть чужие объекты

### Решение  
- ✅ Добавлен фильтр `.eq('user_id', user.id)` в GET запросы
- ✅ Теперь каждый видит только свои properties
- ✅ Добавлена функция удаления (soft delete)

## 📋 Шаги для настройки (5 минут)

### Шаг 1: Проверьте безопасность в Supabase

Откройте **Supabase Dashboard** → **SQL Editor** и запустите:

```sql
-- Файл: supabase/verify-security.sql
-- Скопируйте и вставьте весь файл в SQL Editor
```

**Что проверяется:**
- ✅ RLS включен
- ✅ Политики безопасности существуют  
- ✅ Колонка deleted_at существует
- ✅ Индексы созданы

### Шаг 2: Если нужно - включите RLS

Если проверка показала ❌, запустите:

```sql
-- Файл: supabase/enable-rls.sql
-- Включает Row Level Security и создает политики
```

### Шаг 3: Примените миграцию Soft Delete

```sql
-- Файл: supabase/add-soft-delete-properties.sql
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at);
```

### Шаг 4: Готово! Тестируйте

## 🎯 Как использовать

### Создание Property

1. Нажмите **"+ Add New Property"**
2. Заполните форму:
   - Address (адрес) ✅
   - Price (цена) ✅
   - Beds (спальни) ✅
   - Baths (ванные) ✅
   - Sqft (площадь) ✅
   - Images (фото)
3. Нажмите **"Save Property"**
4. ✅ Property сохранится с вашим `user_id`
5. ✅ Только вы сможете его видеть

### Удаление Property

1. Откройте страницу любого property
2. Нажмите красную кнопку **"Delete Property"**
3. Подтвердите в модальном окне
4. ✅ Property помечается как удаленный (`deleted_at`)
5. ✅ Исчезает из списка

## 🔒 Безопасность (2 уровня защиты)

### Уровень 1: API
```typescript
// Только ваши properties
.eq('user_id', user.id)
.is('deleted_at', null)
```

### Уровень 2: Database (RLS)
```sql
-- Supabase автоматически проверяет
USING (auth.uid() = user_id)
```

## 🧪 Быстрый тест

### 1. Создайте тестовый property
```
Address: Test Property 123
Price: $2000
Beds: 2
Baths: 1.5
Sqft: 950
```

### 2. Проверьте в базе
```sql
SELECT id, address, user_id, deleted_at 
FROM properties 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

Должны увидеть:
- `user_id` = ваш ID ✅
- `deleted_at` = NULL ✅

### 3. Удалите property
- Нажмите "Delete Property"
- Подтвердите

### 4. Проверьте снова
```sql
SELECT id, address, deleted_at 
FROM properties 
WHERE id = 'ваш-property-id';
```

Должны увидеть:
- `deleted_at` = timestamp ✅

## ❓ FAQ

### Q: Где хранятся мои properties?
**A:** В Supabase таблице `properties` с вашим `user_id`

### Q: Могут ли другие пользователи видеть мои properties?
**A:** НЕТ ❌. Только вы можете видеть/редактировать/удалять свои объекты

### Q: Что происходит при удалении?
**A:** Soft delete - property не удаляется физически, а помечается `deleted_at`. Можно восстановить в будущем.

### Q: Как восстановить удаленный property?
**A:** Пока в UI нет кнопки, но можно через SQL:
```sql
UPDATE properties 
SET deleted_at = NULL 
WHERE id = 'property-id';
```

### Q: Что делать если properties не загружаются?
**A:** 
1. Проверьте что вы залогинены
2. Откройте Browser Console (F12) - проверьте ошибки
3. Запустите `verify-security.sql` в Supabase
4. Убедитесь что RLS включен

## 📁 Файлы

```
supabase/
├── verify-security.sql              ← Проверка настроек
├── enable-rls.sql                   ← Включить RLS
├── add-soft-delete-properties.sql   ← Soft delete миграция
└── schema.sql                       ← Основная схема

app/api/properties/
├── route.ts                         ← GET/POST (с user_id фильтром)
└── [id]/route.ts                    ← GET/DELETE (с user_id фильтром)

docs/
├── SECURITY_CHECKLIST.md            ← Чеклист безопасности
├── PROPERTY_DELETE_GUIDE.md         ← Полный гайд по удалению
└── QUICK_START_RU.md                ← Этот файл
```

## ✅ Чеклист готовности

- [ ] Запустили `verify-security.sql`
- [ ] RLS включен (✅ в результатах)
- [ ] Политики созданы (✅ в результатах)
- [ ] `deleted_at` колонка существует
- [ ] Создали тестовый property
- [ ] Проверили что он отображается
- [ ] Удалили тестовый property
- [ ] Проверили что он исчез из списка

**Когда все пункты ✅ - готово к использованию!** 🎉

---

**Вопросы?** Проверьте `SECURITY_CHECKLIST.md` и `PROPERTY_DELETE_GUIDE.md`
