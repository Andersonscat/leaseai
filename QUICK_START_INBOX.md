# ⚡ Быстрый старт Unified Inbox

## 🎯 Что ты получил:

✅ **Unified Inbox** - все лиды в одном месте
✅ **Gmail автоматизация** - парсит email автоматически  
✅ **8 источников** - Zillow, Airbnb, Facebook, Email, SMS, WhatsApp, Craigslist, Manual
✅ **Фильтры** - по источникам
✅ **Ответы** - прямо из Inbox

---

## 🚀 Запуск за 5 минут:

### 1. Обнови БД (30 секунд)

Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages(source);
```

### 2. Открой Inbox

```
http://localhost:3001/dashboard?tab=inbox
```

### 3. Добавь тестовый лид

Нажми **"+ Add Lead"** и создай первый лид вручную

---

## 📧 Gmail автоматизация (опционально, 10 минут):

Если хочешь автоматический импорт из email:

1. Открой `GMAIL_SETUP.md`
2. Следуй инструкциям
3. Нажми "Sync Gmail"

**Без Gmail:** Просто добавляй лиды вручную через "+ Add Lead"

---

## 💡 Что дальше?

**Сейчас работает:**
- ✅ Ручное добавление лидов
- ✅ Просмотр всех лидов
- ✅ Фильтры по источникам
- ✅ Ответы на сообщения

**Можно добавить:**
- 📱 Twilio SMS integration
- 🤖 AI авто-ответы
- 📅 Calendar booking
- 📊 Analytics

---

**Начни с ручного добавления, потом подключай Gmail!**
