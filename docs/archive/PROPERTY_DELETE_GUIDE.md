# 🗑️ Руководство по удалению недвижимости

## Обзор

Система использует **мягкое удаление (soft delete)** для недвижимости. Это означает, что объекты не удаляются полностью из базы данных, а помечаются как удаленные с помощью временной метки `deleted_at`.

## Преимущества мягкого удаления

✅ **Безопасность данных** - можно восстановить случайно удаленные объекты  
✅ **Сохранение связей** - история контрактов и сообщений остается  
✅ **Аудит** - можно отследить когда и что было удалено  
✅ **Гибкость** - возможность добавить функцию восстановления в будущем

## Установка

### 1. Запустить SQL миграцию

Примените файл миграции к вашей базе данных Supabase:

```bash
# В Supabase Dashboard -> SQL Editor
# Запустите содержимое файла: supabase/add-soft-delete-properties.sql
```

Или через CLI:

```bash
supabase db execute -f supabase/add-soft-delete-properties.sql
```

## Как работает удаление

### Backend (API)

**DELETE /api/properties/[id]**
- Проверяет аутентификацию пользователя
- Проверяет владельца объекта (только владелец может удалить)
- Устанавливает `deleted_at = NOW()` вместо физического удаления
- Возвращает успешный ответ

**GET /api/properties**
- Автоматически фильтрует удаленные объекты (`deleted_at IS NULL`)
- Пользователи не видят удаленную недвижимость

### Frontend (UI)

**Страница объекта недвижимости** (`/dashboard/property/[id]`)
- Красная кнопка "Delete Property" в правом верхнем углу
- При клике открывается модальное окно подтверждения
- После подтверждения:
  - Показывается индикатор загрузки
  - Отправляется DELETE запрос
  - Редирект на dashboard с уведомлением об успехе

**Dashboard** (`/dashboard`)
- При успешном удалении показывается toast: "🗑️ Property deleted successfully!"
- Список автоматически обновляется (удаленных объектов нет)

## Код

### API Route

```typescript
// app/api/properties/[id]/route.ts
export async function DELETE(request, { params }) {
  // 1. Проверка аутентификации
  const { user } = await supabase.auth.getUser();
  
  // 2. Проверка владельца
  const property = await supabase
    .from('properties')
    .select('user_id')
    .eq('id', params.id)
    .single();
    
  if (property.user_id !== user.id) {
    return 403 Forbidden;
  }
  
  // 3. Мягкое удаление
  await supabase
    .from('properties')
    .update({ deleted_at: new Date() })
    .eq('id', params.id);
}
```

### Frontend Component

```typescript
const handleDeleteProperty = async () => {
  const response = await fetch(`/api/properties/${propertyId}`, {
    method: 'DELETE',
  });
  
  if (response.ok) {
    router.push('/dashboard?tab=properties&deleted=success');
  }
};
```

## Будущие улучшения

### Опция 1: Добавить функцию восстановления

```sql
-- Восстановить удаленный объект
UPDATE properties 
SET deleted_at = NULL 
WHERE id = 'property-id';
```

### Опция 2: Показать архив удаленных

Добавить вкладку "Archived" в dashboard для просмотра удаленных объектов:

```typescript
// GET /api/properties?show_deleted=true
const query = supabase
  .from('properties')
  .select('*')
  .is('deleted_at', null); // Убрать этот фильтр для архива
```

### Опция 3: Автоматическая очистка (Hard Delete)

Автоматически удалять объекты старше 30 дней:

```sql
-- Cron job или Supabase Function
DELETE FROM properties 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

## Безопасность

- ✅ Только владелец может удалить свою недвижимость
- ✅ Проверка аутентификации на уровне API
- ✅ RLS (Row Level Security) в Supabase обеспечивает дополнительную защиту
- ✅ Модальное окно подтверждения предотвращает случайное удаление

## Тестирование

### 1. Создать тестовый объект
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Cookie: sb-access-token=..." \
  -d '{"address":"Test Property","price":"1000","beds":2}'
```

### 2. Удалить объект
```bash
curl -X DELETE http://localhost:3000/api/properties/[id] \
  -H "Cookie: sb-access-token=..."
```

### 3. Проверить в БД
```sql
SELECT id, address, deleted_at 
FROM properties 
WHERE id = 'property-id';
-- deleted_at должен содержать timestamp
```

## Поддержка

При возникновении проблем проверьте:

1. ✅ Миграция применена к базе данных
2. ✅ Колонка `deleted_at` существует в таблице `properties`
3. ✅ Пользователь аутентифицирован
4. ✅ Пользователь владеет объектом недвижимости

---

**Готово!** 🎉 Функция удаления недвижимости полностью реализована и готова к использованию.
