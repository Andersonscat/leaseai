# 💬 Inbox v2: Conversations (КАК МЕССЕНДЖЕР!)

## ✅ ТЫ БЫЛ ПРАВ! Я ПЕРЕДЕЛАЛ!

### ❌ Старая проблема:
```
Inbox показывал все сообщения подряд:
- Message #1 от John
- Message #2 от John  
- Message #3 от John
- Message #4 от Sarah
- Message #5 от John
... 50+ сообщений! 😱
```

**Если клиент пишет 10 раз → 10 строк в Inbox = спам!**

---

## ✅ Новое решение: CONVERSATIONS!

```
Inbox (как WhatsApp/Telegram):
- 💬 John Smith (3 unread) "Thanks for the info..."
- 💬 Sarah Wilson (1 unread) "When can we schedule..."  
- 💬 Mike Johnson (0 unread) "You: I'll send details..."
```

**Один человек = одна conversation, сколько бы раз он не писал!**

---

## 🎯 Как работает:

### 1. **Новый лид с Zillow:**
```
Email приходит → Парсится → Создается tenant + message
→ Появляется в Inbox как новая conversation
```

### 2. **Тот же клиент пишет еще раз:**
```
Email от john@example.com → Находим существующий tenant
→ Добавляем к той же conversation (не создаем новую!)
→ Unread count увеличивается (2, 3, 4...)
```

### 3. **Ты отвечаешь:**
```
Открываешь conversation → Видишь всю историю
→ Пишешь ответ → Сообщение добавляется
→ Unread обнуляется
```

### 4. **Клиент отвечает снова:**
```
→ Добавляется к той же conversation
→ Unread badge снова появляется
→ Conversation поднимается наверх списка
```

---

## 📊 Inbox показывает:

Для каждой conversation:
- ✅ **Avatar** - аватар или инициалы
- ✅ **Имя** - John Smith
- ✅ **Property** - Re: 123 Main St (если есть)
- ✅ **Last message** - preview последнего сообщения
- ✅ **Кто писал** - "You:" если ты, иначе клиент
- ✅ **Unread badge** - красный кружок с цифрой
- ✅ **Source** - 🏠 Zillow, 📧 Email, etc
- ✅ **Время** - когда последнее сообщение
- ✅ **Total messages** - сколько всего сообщений в чате

---

## 💬 Conversation Thread:

Открываешь conversation → видишь:
- Всю историю переписки
- Сообщения клиента слева (белые)
- Твои сообщения справа (черные)
- Timestamps для каждого
- Поле для ответа внизу
- Enter to send

**Как в любом мессенджере!**

---

## 🔧 Что изменилось:

### **API:**
- ❌ Старый: `GET /api/leads` (все сообщения подряд)
- ✅ Новый: `GET /api/conversations` (группировка по tenant)
- ✅ Новый: `GET /api/conversations/:tenantId` (весь thread)
- ✅ Новый: `POST /api/conversations/:tenantId` (ответ в thread)

### **UI:**
- ❌ Старый: `InboxTab` (список сообщений)
- ✅ Новый: `ConversationsInbox` (список conversations)

### **База данных:**
- ✅ **НИЧЕГО НЕ МЕНЯЛИ!**
- Просто группируем messages по `tenant_id`
- Все существующие данные работают!

---

## 🚀 Запуск:

### 1. Обнови БД (если еще не делал):
```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages(source);
```

### 2. Запусти сервер:
```bash
npm run dev
```

### 3. Открой Inbox:
```
http://localhost:3001/dashboard?tab=inbox
```

### 4. Добавь тестовую conversation:
- Нажми "New Conversation"
- Заполни форму
- Отправь

### 5. Добавь еще сообщение от того же человека:
- Создай еще одну с тем же email
- Увидишь что **не создалась новая conversation**!
- Просто добавилось к существующей!

---

## 📧 Gmail Sync:

**Умная группировка:**

1. Email #1 от john@example.com → Создается tenant + conversation
2. Email #2 от john@example.com → Добавляется к той же conversation
3. Email #3 от john@example.com → Добавляется к той же conversation
4. Email #1 от sarah@example.com → Создается новая conversation

**Результат в Inbox:**
```
💬 John Smith (3 unread)  ← Все 3 email в одной conversation
💬 Sarah Wilson (1 unread) ← Отдельная conversation
```

---

## 🎯 Фильтрация:

**Smart Filter (работает!):**
- Рассылки от Zillow → Фильтруются
- Промо/спам → Фильтруются
- Благодарности → Фильтруются
- **Реальные лиды → Импортируются**
- **Сообщения от клиентов → Добавляются к существующим conversations**

**В консоли увидишь:**
```
⏭️  Skipping non-lead: "Weekly market report"
✅ Processing lead: "Inquiry from John Smith"
✅ Adding to existing conversation: "Re: from John Smith"
⏭️  Skipping non-lead: "Upgrade to premium"
✅ Processing lead: "Question from Sarah Wilson"
```

---

## 💡 Примеры:

### **Scenario 1: Новый лид**
```
1. Email от john@example.com: "Interested in 123 Main St"
2. Создается tenant "John Smith"
3. Создается message
4. В Inbox появляется:
   💬 John Smith (1 unread) "Interested in 123 Main St"
```

### **Scenario 2: Клиент пишет снова**
```
1. Email от john@example.com: "When can we schedule?"
2. Находим существующий tenant
3. Добавляем message к той же conversation
4. В Inbox обновляется:
   💬 John Smith (2 unread) "When can we schedule?"
```

### **Scenario 3: Ты отвечаешь**
```
1. Открываешь conversation с John
2. Пишешь: "How about this weekend?"
3. Message добавляется с sender_type="landlord"
4. В Inbox:
   💬 John Smith (0 unread) "You: How about this weekend?"
```

### **Scenario 4: Клиент отвечает**
```
1. Email от john@example.com: "Perfect! Saturday works"
2. Добавляется к той же conversation
3. В Inbox:
   💬 John Smith (1 unread) "Perfect! Saturday works"
```

**Вся переписка в одном месте! Никакого спама!**

---

## 🎉 Итог:

### ✅ Что получили:
- Чистый Inbox (один человек = одна строка)
- Группировка по клиентам (не 50 строк от одного)
- Вся история в conversation thread
- Unread count для каждой conversation
- Работает с Gmail sync автоматически
- Фильтрация рассылок и спама
- AI парсинг (опционально)

### ✅ Без изменений в БД:
- Никаких миграций
- Существующие данные работают
- Просто умная группировка

### ✅ Как настоящий мессенджер:
- WhatsApp/Telegram style
- Thread view
- Real-time ready (можно добавить websockets)

---

## 📖 Документация:

- `CONVERSATIONS_ARCHITECTURE.md` - подробная архитектура
- `FILTERING_LEADS.md` - как работает фильтрация
- `AI_EMAIL_PARSING.md` - AI vs regex парсинг
- `GMAIL_SETUP.md` - настройка Gmail API

---

**Теперь Inbox работает правильно!** 🎯

**Один клиент = одна conversation, сколько бы он ни писал!** 💬
