# 📥 Unified Inbox Setup Complete!

## ✅ Что создано:

### 1. API Endpoints:
- `GET /api/leads` - получить все лиды
- `POST /api/leads` - создать лид вручную
- `POST /api/leads/[id]/reply` - ответить на лид

### 2. Database Migration:
- Добавлено поле `source` в таблицу `messages`
- Поддержка платформ: zillow, airbnb, facebook, email, sms, whatsapp, craigslist, manual

### 3. Inbox UI (создаётся):
- Форма "Add Lead" для ручного добавления
- Список всех лидов
- Фильтры по платформам
- Просмотр разговора
- Возможность ответить

## 🚀 Как запустить:

### Шаг 1: Обновить БД
В Supabase Dashboard → SQL Editor:
```sql
-- Запустите файл: supabase/add-source-to-messages.sql
```

### Шаг 2: Перезапустить сервер
```bash
npm run dev
```

### Шаг 3: Открыть Inbox
http://localhost:3001/dashboard?tab=inbox

## 📋 Поддерживаемые источники:

- 📧 **email** - Email уведомления
- 📱 **sms** - SMS сообщения
- 🏠 **zillow** - Zillow leads
- 🏡 **airbnb** - Airbnb inquiries
- 📘 **facebook** - Facebook Marketplace
- 💬 **whatsapp** - WhatsApp Business
- 📝 **craigslist** - Craigslist responses
- ✋ **manual** - Добавлено вручную

## 🎯 Следующие шаги:

### Автоматизация (Фаза 2):
1. Gmail API - парсинг email
2. Twilio - SMS integration
3. Facebook Webhook - Messenger
4. WhatsApp Business API

