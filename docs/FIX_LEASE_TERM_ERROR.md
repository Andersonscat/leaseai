# Исправление Ошибки: lease_term Column Not Found

## Проблема
```
Error: Could not find the 'lease_term' column of 'properties' in the schema cache
```

Эта ошибка возникает потому, что новые колонки в таблице `properties` ещё не были добавлены в базу данных.

---

## Быстрое Решение

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (слева в меню)
4. Скопируйте содержимое файла `supabase/add-enhanced-property-fields.sql`
5. Вставьте в редактор и нажмите **Run**

### Вариант 2: Через Supabase CLI

```bash
# Находясь в корне проекта
cd /Users/assylzhantati/Downloads/realtoros

# Выполните миграцию
supabase db push --file supabase/add-enhanced-property-fields.sql
```

### Вариант 3: Вручную через SQL

Подключитесь к вашей БД и выполните:

```sql
-- Add new fields
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS parking VARCHAR(100) DEFAULT 'No parking';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS walk_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS transit_score INTEGER;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS lease_term VARCHAR(50) DEFAULT '12 months';

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS utilities TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS internet_available BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_properties_walk_score ON properties(walk_score);
CREATE INDEX IF NOT EXISTS idx_properties_transit_score ON properties(transit_score);
CREATE INDEX IF NOT EXISTS idx_properties_lease_term ON properties(lease_term);
```

---

## Что Добавляется

| Колонка | Тип | По умолчанию | Описание |
|---------|-----|--------------|----------|
| `parking` | VARCHAR(100) | 'No parking' | Информация о парковке |
| `walk_score` | INTEGER | NULL | Оценка пешей доступности (0-100) |
| `transit_score` | INTEGER | NULL | Оценка общественного транспорта (0-100) |
| `lease_term` | VARCHAR(50) | '12 months' | Срок аренды |
| `utilities` | TEXT[] | [] | Массив коммунальных услуг |
| `internet_available` | BOOLEAN | false | Доступность интернета |

---

## После Применения Миграции

1. ✅ Перезапустите приложение (если запущено локально)
2. ✅ Обновите страницу в браузере (Ctrl+Shift+R / Cmd+Shift+R)
3. ✅ Проверьте, что ошибка исчезла

---

## Проверка Успешности

Выполните в SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('parking', 'walk_score', 'transit_score', 'lease_term', 'utilities', 'internet_available');
```

Должно вернуть 6 строк с информацией о новых колонках.

---

## Файлы

- ✅ **`types/database.ts`** - обновлён интерфейс Property
- ✅ **`supabase/add-enhanced-property-fields.sql`** - миграционный скрипт
- 📄 **Этот файл** - инструкция по применению

---

**Дата:** 25 января 2026  
**Статус:** Готово к применению
