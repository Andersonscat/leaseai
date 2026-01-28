# ☑️ Массовый выбор и удаление Properties

## 🎯 Что реализовано

Добавлена полноценная система массового выбора и удаления недвижимости с красивым UI и подтверждением.

### ✅ Функции

1. **Кнопка "Select"** - включает режим выбора
2. **Чекбоксы на карточках** - выбор отдельных properties
3. **Плавающая панель действий** - появляется при выборе
4. **Массовое удаление** - удаление нескольких объектов сразу
5. **Модальное окно** - подтверждение перед удалением
6. **Select All / Deselect All** - быстрый выбор всех

---

## 🎨 UI/UX

### 1. Кнопка Select
- **Расположение:** Справа от кнопки Filter
- **Состояния:**
  - Обычное: черная кнопка с иконкой Square
  - Активное: синяя кнопка с иконкой CheckSquare
- **Переключение:** "Select" ↔ "Cancel"

### 2. Чекбоксы на карточках
- **Расположение:** Левый верхний угол карточки
- **Появление:** Только в режиме выбора
- **Дизайн:**
  - Невыбранный: белый фон с иконкой Square
  - Выбранный: синий фон с иконкой CheckSquare
- **Поведение:** 
  - Клик на чекбокс → переключение
  - Клик на карточку → переключение (не переход)

### 3. Плавающая панель (Bottom Bar)
- **Появление:** Когда выбран хотя бы 1 property
- **Расположение:** Внизу по центру экрана
- **Анимация:** Slide up from bottom
- **Содержимое:**
  - Счетчик: "2 selected"
  - Кнопка "Select All" / "Deselect All"
  - Кнопка "Delete" (красная)

### 4. Модальное окно
- **Триггер:** Клик на "Delete" в панели
- **Дизайн:**
  - Иконка корзины в красном круге
  - Заголовок: "Delete N Properties?"
  - Описание с числом объектов
  - Две кнопки: Cancel и Delete All
- **Индикатор загрузки:** Спиннер во время удаления

---

## 💻 Как использовать

### Базовый сценарий

1. **Включить режим выбора**
   - Нажмите кнопку **"Select"** (справа от Filter)
   - Кнопка станет синей и изменится на "Cancel"

2. **Выбрать properties**
   - Вариант А: Кликайте на чекбоксы в углу карточек
   - Вариант Б: Кликайте на сами карточки
   - Вариант В: Нажмите "Select All" в нижней панели

3. **Удалить выбранные**
   - В нижней панели нажмите красную кнопку **"Delete"**
   - Подтвердите в модальном окне
   - Дождитесь завершения (индикатор загрузки)

4. **Выйти из режима**
   - Нажмите **"Cancel"** (синяя кнопка вверху)
   - Или удаление автоматически выключит режим

### Продвинутые сценарии

#### Выбрать все кроме одного
```
1. Нажать "Select All"
2. Кликнуть на чекбокс ненужного property
```

#### Быстро выбрать несколько
```
1. Включить Select mode
2. Кликать по карточкам (без перехода на страницу)
```

#### Отменить выбор
```
- "Cancel" → выключить режим
- "Deselect All" → снять все галочки
- Клик на выбранный → снять галочку
```

---

## 🛠️ Технические детали

### Состояние (State)

```typescript
// Режим выбора вкл/выкл
const [selectionMode, setSelectionMode] = useState(false);

// Set выбранных ID
const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());

// Модалка удаления
const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

// Процесс удаления
const [bulkDeleting, setBulkDeleting] = useState(false);
```

### Ключевые функции

#### 1. toggleSelectionMode()
```typescript
// Включить/выключить режим выбора
const toggleSelectionMode = () => {
  setSelectionMode(!selectionMode);
  setSelectedProperties(new Set()); // Сброс выбора
};
```

#### 2. togglePropertySelection(id)
```typescript
// Выбрать/снять галочку с property
const togglePropertySelection = (propertyId: string) => {
  const newSelection = new Set(selectedProperties);
  if (newSelection.has(propertyId)) {
    newSelection.delete(propertyId);
  } else {
    newSelection.add(propertyId);
  }
  setSelectedProperties(newSelection);
};
```

#### 3. selectAllProperties()
```typescript
// Выбрать все или снять все
const selectAllProperties = () => {
  if (selectedProperties.size === sortedProperties.length) {
    setSelectedProperties(new Set()); // Снять все
  } else {
    setSelectedProperties(new Set(sortedProperties.map(p => p.id))); // Выбрать все
  }
};
```

#### 4. handleBulkDelete()
```typescript
// Массовое удаление
const handleBulkDelete = async () => {
  setBulkDeleting(true);
  
  // Параллельное удаление всех выбранных
  const deletePromises = Array.from(selectedProperties).map(id =>
    fetch(`/api/properties/${id}`, { method: 'DELETE' })
  );
  
  await Promise.all(deletePromises);
  
  // Обновить список
  // Показать toast
  // Выйти из режима выбора
};
```

### API Endpoints

```typescript
// DELETE /api/properties/[id]
// Уже существующий endpoint для single delete
// Используется для каждого выбранного property
```

---

## 🎨 Стили и анимации

### Чекбокс
```css
/* Невыбранный */
bg-white/90 text-gray-600 hover:bg-white

/* Выбранный */
bg-blue-600 text-white
```

### Плавающая панель
```css
/* Позиция */
fixed bottom-8 left-1/2 -translate-x-1/2 z-50

/* Анимация появления */
animate-in slide-in-from-bottom-5
```

### Карточка в режиме выбора
```typescript
// При клике не переходит, а выбирает
onClick={(e) => {
  if (selectionMode) {
    e.preventDefault();
    togglePropertySelection(property.id);
  }
}}
```

---

## 🔄 User Flow

```
[Properties List]
      ↓
  Click "Select"
      ↓
[Selection Mode Active]
  - Checkboxes appear
  - Cards become selectable
      ↓
  Click on cards/checkboxes
      ↓
[Properties Selected]
  - Bottom bar appears
  - Counter shows "N selected"
      ↓
  Click "Delete"
      ↓
[Confirmation Modal]
  - Shows count
  - Asks for confirmation
      ↓
  Click "Delete All"
      ↓
[Deleting...]
  - Spinner shows
  - API calls in parallel
      ↓
[Success]
  - Toast notification
  - List refreshed
  - Mode exits
```

---

## 🚀 Возможные улучшения

### 1. Дополнительные действия
Вместо только Delete, добавить:
```typescript
<button>Change Status</button>
<button>Archive</button>
<button>Export</button>
```

### 2. Фильтрация выбора
```typescript
<button>Select Available Only</button>
<button>Select Rented Only</button>
```

### 3. Поиск и выбор
```typescript
// Выбрать все результаты поиска
const selectSearchResults = () => {
  const filtered = properties.filter(p => 
    p.address.includes(searchQuery)
  );
  setSelectedProperties(new Set(filtered.map(p => p.id)));
};
```

### 4. Keyboard shortcuts
```typescript
// Ctrl+A → Select all
// Escape → Cancel selection
// Delete → Open delete modal
```

### 5. Drag & Drop
```typescript
// Перетащить карточки для группового выбора
// Прямоугольное выделение мышью
```

### 6. Undo функция
```typescript
// После удаления показать "Undo" в toast
// Восстановить deleted_at = NULL
```

---

## 📊 Статистика

### Производительность
- **Рендеринг:** O(n) где n = количество properties
- **Выбор:** O(1) благодаря Set
- **Удаление:** Параллельное (Promise.all)

### UX метрики
- **Клики для удаления 5 объектов:**
  - Без bulk: 5 × 3 = 15 кликов
  - С bulk: 1 (Select) + 5 (карточки) + 1 (Delete) + 1 (Confirm) = **8 кликов**
  - **Экономия: 47%** ⚡

---

## ⚠️ Важные детали

### 1. Предотвращение случайного удаления
- ✅ Модальное окно подтверждения
- ✅ Показывает количество объектов
- ✅ Кнопка "Cancel" доступна
- ✅ Disabled во время удаления

### 2. Обработка ошибок
```typescript
const allSuccessful = results.every(res => res.ok);

if (!allSuccessful) {
  alert('Some properties failed to delete');
}
```

### 3. Обновление UI
```typescript
// После удаления обновляем список
const response = await fetch(`/api/properties?type=${propertyType}`);
const data = await response.json();
setProperties(data.properties || []);
```

### 4. Автовыход из режима
```typescript
// После успешного удаления
setSelectionMode(false);
setSelectedProperties(new Set());
```

---

## 🧪 Тестирование

### Сценарии для теста

1. **Базовый флоу**
   - [ ] Включить Select mode
   - [ ] Выбрать 3 property
   - [ ] Удалить
   - [ ] Проверить что удалены

2. **Select All**
   - [ ] Нажать Select All
   - [ ] Все выбраны
   - [ ] Нажать Deselect All
   - [ ] Все сняты

3. **Cancel**
   - [ ] Выбрать несколько
   - [ ] Нажать Cancel
   - [ ] Режим выключен
   - [ ] Выбор сброшен

4. **Модалка**
   - [ ] Можно закрыть крестиком
   - [ ] Можно отменить
   - [ ] Disabled во время удаления
   - [ ] Spinner показывается

5. **Toast**
   - [ ] Показывается после удаления
   - [ ] Правильное число объектов
   - [ ] Автоматически исчезает

---

## 🎉 Результат

**До:**
- ❌ Удаление только по одному
- ❌ Много кликов
- ❌ Неудобно для большого количества

**После:**
- ✅ Массовый выбор
- ✅ Удобная панель действий
- ✅ Подтверждение безопасности
- ✅ Красивая анимация
- ✅ Экономия времени

---

**Функция готова к использованию!** 🚀

Попробуйте:
1. Создайте несколько тестовых properties
2. Нажмите "Select"
3. Выберите несколько
4. Удалите группой

**Wow-эффект гарантирован!** ✨
