# 🚀 Что делать дальше - СЕЙЧАС

## ✅ ЧТО УЖЕ ГОТОВО:

1. ✅ БД обновлена (source column added)
2. ✅ OpenAI API key добавлен
3. ✅ AI email фильтрация создана
4. ✅ Inbox UI готов
5. ✅ Conversations API готов
6. ✅ Gmail integration готов

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ:

### **Шаг 1: Скопируй API key в .env.local (1 минута)**

```bash
# Открой или создай файл .env.local
# Добавь эту строку (уже есть в .env.local.example):

OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Или просто скопируй весь .env.local.example в .env.local:**
```bash
cp .env.local.example .env.local
```

---

### **Шаг 2: Запусти сервер (1 секунда)**

```bash
npm run dev
```

---

### **Шаг 3: Открой Inbox (1 секунда)**

```
http://localhost:3001/dashboard?tab=inbox
```

---

### **Шаг 4: Протестируй (5 минут)**

**Вариант A: Ручное добавление**
1. Нажми "New Conversation"
2. Заполни форму
3. Отправь
4. Увидишь conversation в списке

**Вариант B: Gmail Sync (если хочешь)**
1. Настрой Gmail OAuth (см. GMAIL_SETUP.md)
2. Нажми "Sync Gmail"
3. AI автоматически отфильтрует и импортирует лиды

---

## 🎯 ПОСЛЕ ТЕСТИРОВАНИЯ:

### **Если работает - следующие фичи:**

1. **AI Auto-responder** (30 мин)
   - Автоматические ответы на новые лиды
   - "Is this available?" → AI отвечает

2. **Usage limits UI** (1 час)
   - Показать счетчики использования
   - Warnings при приближении к лимиту

3. **Stripe integration** (1-2 часа)
   - Подключить платежи
   - Тарифные планы

---

## 💡 ПРОБЛЕМЫ?

### **Если Inbox пустой:**
- Это нормально! Добавь первый лид вручную

### **Если Gmail sync не работает:**
- Проверь что Gmail API настроен (GMAIL_SETUP.md)
- Проверь OPENAI_API_KEY в .env.local
- Смотри консоль - там будут логи

### **Если ошибки в консоли:**
- Покажи мне - я помогу!

---

## 📊 ЧТО ПОЛУЧИШЬ:

```
✅ Working Inbox (conversations)
✅ AI email filtering (умная фильтрация)
✅ Manual lead adding (ручное добавление)
✅ Thread view (вся история)
✅ Source tracking (откуда лид)
```

---

**Начни с Шага 1!** 🚀

**После тестирования пиши - добавим AI auto-responder!** 🤖
