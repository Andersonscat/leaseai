# 💬 Conversations Architecture

## ❌ Старая проблема:

```
Inbox (как список email):
- Message #1 from John
- Message #2 from John
- Message #3 from John
- Message #4 from Sarah
- Message #5 from John
... 50+ messages! 😱
```

**Проблемы:**
- Спам в inbox если клиент пишет много
- Нет группировки по человеку
- Сложно отследить conversation
- Не видно сколько непрочитанных от конкретного человека

---

## ✅ Новая архитектура:

```
Inbox (Conversations):
- 💬 John Smith (3 unread, 12 total)
- 💬 Sarah Wilson (1 unread, 5 total)  
- 💬 Mike Johnson (0 unread, 8 total)
```

**Как мессенджер:**
- Один контакт = одна conversation
- Показываем последнее сообщение
- Unread count для каждой conversation
- Открываешь → видишь всю историю переписки

---

## 🏗️ Структура данных:

### **Table: messages (не меняли!)**
```sql
messages:
  - id
  - user_id (landlord)
  - tenant_id ← Группируем по этому!
  - property_id
  - sender_type (tenant/landlord)
  - sender_name
  - message_text
  - source
  - is_read
  - created_at
```

**Ничего не меняли в БД!** Просто группируем по `tenant_id`.

---

## 🔄 Как работает:

### **API: GET /api/conversations**

```typescript
// 1. Достаем все messages
SELECT * FROM messages WHERE user_id = current_user

// 2. Группируем по tenant_id
conversations = groupBy(messages, 'tenant_id')

// 3. Для каждой conversation:
{
  tenant_id: "123",
  tenant: {...},
  last_message: "Thanks for the info...",
  last_message_time: "2026-01-18 10:30",
  last_sender_type: "tenant",
  unread_count: 3,          ← Сколько непрочитанных
  total_messages: 12,        ← Всего сообщений
  source: "zillow",
}
```

### **API: GET /api/conversations/:tenantId**

```typescript
// Достаем все messages для этого tenant
SELECT * FROM messages 
WHERE tenant_id = :tenantId 
ORDER BY created_at ASC

// Возвращаем thread (всю переписку)
[
  { sender: "tenant", text: "Hi, interested in property", time: "10:00" },
  { sender: "landlord", text: "Great! When can you view?", time: "10:05" },
  { sender: "tenant", text: "This weekend?", time: "10:10" },
  ...
]

// Помечаем все сообщения от tenant как прочитанные
UPDATE messages 
SET is_read = true 
WHERE tenant_id = :tenantId AND sender_type = 'tenant'
```

---

## 🎨 UI:

### **Inbox (список conversations):**
```
┌─────────────────────────────────────────┐
│ 📥 Inbox                   [Sync] [+New] │
├─────────────────────────────────────────┤
│                                           │
│ 👤 John Smith           ③ 🏠 Zillow      │
│    Re: 123 Main St                       │
│    Thanks for the info...      2h ago    │
│    ─────────────────────────────────────  │
│                                           │
│ 👤 Sarah Wilson         ① 📧 Email       │
│    Re: Downtown apartment                │
│    You: When can we schedule?  1d ago    │
│    ─────────────────────────────────────  │
│                                           │
│ 👤 Mike Johnson           🏡 Airbnb      │
│    You: I'll send you details  3d ago    │
│                                           │
└─────────────────────────────────────────┘
```

**Показываем:**
- ✅ Avatar / Initials
- ✅ Имя + property address
- ✅ Последнее сообщение (preview)
- ✅ Кто отправил ("You:" если landlord)
- ✅ Unread badge (красный кружок с цифрой)
- ✅ Source icon (Zillow/Airbnb/etc)
- ✅ Время последнего сообщения
- ✅ Всего сообщений в conversation

### **Conversation Thread (открываем чат):**
```
┌─────────────────────────────────────────┐
│ ← John Smith                         ✕   │
│   🏠 Zillow • john@example.com           │
├─────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────┐                 │
│  │ John Smith 10:00 AM │                 │
│  │ Hi, interested in   │                 │
│  │ viewing the apt     │                 │
│  └─────────────────────┘                 │
│                                           │
│            ┌─────────────────────┐       │
│            │ You 10:05 AM        │       │
│            │ Great! When works?  │       │
│            └─────────────────────┘       │
│                                           │
│  ┌─────────────────────┐                 │
│  │ John Smith 10:10 AM │                 │
│  │ This weekend?       │                 │
│  └─────────────────────┘                 │
│                                           │
├─────────────────────────────────────────┤
│ [Type your reply...]           [Send →]  │
└─────────────────────────────────────────┘
```

**Фичи:**
- ✅ Вся история переписки
- ✅ Автоскролл вниз
- ✅ Визуальное разделение (tenant слева, landlord справа)
- ✅ Timestamps
- ✅ Enter to send
- ✅ Auto mark as read
- ✅ Real-time (можно добавить websockets)

---

## 📧 Gmail Sync → Conversations:

### **Что происходит:**

1. **Новый email от John:**
```
From: john@example.com
Subject: Inquiry about 123 Main St
Body: Hi, I'm interested...
```

2. **Парсим и создаем tenant (если новый):**
```sql
INSERT INTO tenants (name, email) VALUES ('John', 'john@example.com')
→ tenant_id = "abc123"
```

3. **Создаем первое сообщение:**
```sql
INSERT INTO messages (tenant_id, sender_type, message_text, source)
VALUES ('abc123', 'tenant', 'Hi, I'm interested...', 'zillow')
```

4. **В Inbox появляется новая conversation:**
```
💬 John (1 unread) "Hi, I'm interested..."
```

5. **Второй email от John:**
```
From: john@example.com  ← Тот же email!
Subject: Re: When can we schedule?
Body: This weekend works
```

6. **Находим существующий tenant:**
```sql
SELECT id FROM tenants WHERE email = 'john@example.com'
→ tenant_id = "abc123"  ← Тот же!
```

7. **Добавляем к той же conversation:**
```sql
INSERT INTO messages (tenant_id, sender_type, message_text)
VALUES ('abc123', 'tenant', 'This weekend works')
```

8. **В Inbox обновляется та же conversation:**
```
💬 John (2 unread) "This weekend works"  ← Обновилось!
```

---

## 🎯 Преимущества:

### ✅ Для пользователя:
- Чистый inbox (один человек = одна строка)
- Видно кто писал последним
- Видно сколько непрочитанных от каждого
- Вся история в одном месте

### ✅ Для разработчика:
- Простая группировка (по tenant_id)
- Не нужно менять БД
- Легко добавить фичи (typing indicators, seen status)
- Готово для real-time (websockets)

### ✅ Для масштабирования:
- 1 человек = 1 conversation
- Даже если он написал 100 раз
- Inbox не захламляется
- Быстрая загрузка (только последние сообщения)

---

## 🔮 Будущие фичи:

### **Level 1 (легко добавить):**
- ✅ Search conversations
- ✅ Archive conversations
- ✅ Pin important conversations
- ✅ Star/Flag conversations
- ✅ Filter by unread only

### **Level 2 (нужно немного работы):**
- 🔔 Push notifications
- 📎 File attachments
- 🎙️ Voice messages
- 👁️ "Seen" status
- ⌨️ "Typing..." indicator

### **Level 3 (advanced):**
- 🤖 AI auto-responses
- 📅 Schedule message
- 🔄 Templates/Quick replies
- 👥 Group conversations
- 🔗 Link to contracts/properties

---

## 📊 Performance:

### **Текущий подход:**
```sql
-- Один запрос для всех messages
SELECT * FROM messages WHERE user_id = current_user
ORDER BY created_at DESC

-- Группировка в коде (быстро)
conversations = groupBy(messages, 'tenant_id')
```

**Для 1000 messages:**
- Query: ~50ms
- Grouping: ~10ms
- **Total: ~60ms** ⚡

### **Оптимизация (если нужно):**
```sql
-- Создать materialized view
CREATE MATERIALIZED VIEW conversations AS
SELECT 
  tenant_id,
  MAX(created_at) as last_message_time,
  COUNT(*) as total_messages,
  SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count
FROM messages
GROUP BY tenant_id;

-- Refresh автоматически или по триггеру
```

---

## 🚀 Миграция:

**Ничего не нужно менять в БД!**

Просто:
1. ✅ Заменили `/api/leads` на `/api/conversations`
2. ✅ Заменили `InboxTab` на `ConversationsInbox`
3. ✅ Логика группировки в API

**Все существующие данные работают!** 🎉

---

## 💬 Примеры использования:

### **Новый лид с Zillow:**
```
1. Email приходит → Парсится
2. Создается tenant + message
3. Появляется в Inbox как новая conversation
4. Unread badge (1)
```

### **Клиент пишет еще раз:**
```
1. Email от того же адреса
2. Находим существующий tenant
3. Добавляем message к той же conversation
4. Unread badge увеличивается (2)
5. Conversation поднимается наверх (сортировка по времени)
```

### **Ты отвечаешь:**
```
1. Открываешь conversation
2. Пишешь ответ
3. Message добавляется с sender_type="landlord"
4. Unread badge сбрасывается
5. "You:" показывается в preview
```

### **Клиент отвечает снова:**
```
1. Email приходит
2. Добавляется к той же conversation
3. Unread badge снова появляется
4. Conversation снова наверху
```

---

**Итог: Теперь Inbox работает как настоящий мессенджер!** 💬

**Никакого спама, чистая структура, все по conversation!** 🎯
