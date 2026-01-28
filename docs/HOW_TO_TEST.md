# ✅ Как протестировать Inbox

## 🎯 ЧТО Я СДЕЛАЛ:

1. ✅ Добавил `OPENAI_API_KEY` в `.env.local`
2. ✅ Перезапустил сервер (npm run dev)
3. ✅ Сервер запущен в фоне

---

## 🚀 КАК ПРОВЕРИТЬ:

### **Шаг 1: Открой браузер**

```
http://localhost:3001/dashboard?tab=inbox
```

Должен увидеть:
```
┌─────────────────────────────────────┐
│ 📥 Inbox                            │
│ All caught up!                      │
│                                     │
│ [Sync Gmail] [New Conversation]    │
└─────────────────────────────────────┘

Фильтры: [All Sources] [Zillow] [Airbnb] ...

Empty state:
"No conversations yet
Start a new conversation or sync your Gmail..."
```

---

### **Шаг 2: Добавь тестовый лид**

1. Нажми **"New Conversation"**
2. Заполни форму:
   ```
   Name: John Smith
   Email: john@test.com
   Phone: +1 555-1234
   Source: Zillow (или любой)
   Message: Hi, I'm interested in viewing the property
   ```
3. Нажми **"Start Conversation"**

**Должно произойти:**
- ✅ Модал закрывается
- ✅ Появляется conversation в списке:
  ```
  💬 John Smith (1 unread) 🏠 Zillow
     Hi, I'm interested in...
     Just now
  ```

---

### **Шаг 3: Открой conversation**

1. Кликни на conversation с John Smith
2. Должен открыться модал с историей:
   ```
   ┌─────────────────────────────────────┐
   │ ← John Smith • john@test.com    ✕  │
   ├─────────────────────────────────────┤
   │                                     │
   │  ┌──────────────────────────────┐   │
   │  │ John Smith 10:30 AM          │   │
   │  │ Hi, I'm interested in        │   │
   │  │ viewing the property         │   │
   │  └──────────────────────────────┘   │
   │                                     │
   ├─────────────────────────────────────┤
   │ [Type reply...]        [Send →]    │
   └─────────────────────────────────────┘
   ```

---

### **Шаг 4: Ответь на сообщение**

1. Напиши в поле: "Great! When can you view it?"
2. Нажми **Send** (или Enter)

**Должно произойти:**
- ✅ Твое сообщение появляется справа (черный фон)
- ✅ Unread badge исчезает
- ✅ В списке показывается "You: Great! When can..."

---

### **Шаг 5: Добавь еще один лид**

1. Закрой модал (X)
2. Нажми **"New Conversation"** снова
3. Добавь другого человека:
   ```
   Name: Sarah Wilson
   Email: sarah@test.com
   Message: Is this still available?
   ```

**Должно произойти:**
- ✅ Теперь 2 conversations в списке
- ✅ Sarah наверху (новее)
- ✅ John внизу (старше)

---

### **Шаг 6: Проверь фильтры**

1. Нажми на фильтр **"Zillow"**
2. Должен показать только Zillow лиды
3. Нажми **"All Sources"**
4. Должен показать все обратно

---

## 🧪 ТЕСТ AI ФИЛЬТРАЦИИ (опционально):

Если хочешь протестировать AI фильтрацию email:

### **Вариант A: Gmail Sync (если настроен)**

1. Настрой Gmail OAuth (см. GMAIL_SETUP.md)
2. Нажми **"Sync Gmail"**
3. Смотри консоль браузера (F12 → Console)

**Должен увидеть:**
```
🤖 AI Filter: ✅ LEAD - Clear inquiry (98% confidence)
⏭️  AI Skipped: "Weekly market report"
✅ AI Approved: "Question about property"
```

---

### **Вариант B: Проверка в коде**

Открой консоль сервера (terminal где запущен npm run dev):

```bash
# Если AI работает, увидишь:
🤖 AI Filter: ✅ LEAD - Clear inquiry about property (98% confidence)
⏭️  AI Skipped: Newsletter content (95% confidence)
```

---

## ✅ ЧЕКЛИСТ ТЕСТИРОВАНИЯ:

```
⬜ Открыл http://localhost:3001/dashboard?tab=inbox
⬜ Увидел Inbox UI
⬜ Добавил первый лид через "New Conversation"
⬜ Conversation появился в списке
⬜ Открыл conversation (кликнул)
⬜ Увидел историю сообщений
⬜ Отправил ответ
⬜ Ответ появился справа
⬜ Добавил второй лид
⬜ Увидел 2 conversations
⬜ Проверил фильтры (работают)
```

---

## 🐛 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ:

### **Inbox не открывается:**
```bash
# Проверь что сервер запущен:
ps aux | grep "next dev"

# Если не запущен:
npm run dev
```

### **Ошибка при добавлении лида:**
```
F12 → Console → покажи мне ошибку
```

### **Conversation не появляется:**
```
F12 → Network → смотри запросы к /api/leads
```

### **Модал не открывается:**
```
F12 → Console → ищи JavaScript ошибки
```

---

## 📊 ЧТО ДОЛЖНО РАБОТАТЬ:

```
✅ Inbox UI загружается
✅ "New Conversation" открывает форму
✅ Форма отправляется
✅ Conversation появляется в списке
✅ Клик открывает thread view
✅ Можно отправить ответ
✅ Фильтры работают
✅ Unread count обновляется
```

---

## 🎯 СЛЕДУЮЩИЙ ШАГ:

**Если всё работает:**
- Пиши мне - добавим **AI Auto-responder**!
- Автоматические ответы на новые лиды
- "Is this available?" → AI отвечает сразу

**Если что-то не работает:**
- Покажи ошибку - я помогу!
- Screenshot или текст ошибки из Console

---

**Начни тестирование!** 🚀

**Открой:** http://localhost:3001/dashboard?tab=inbox
