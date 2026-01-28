# ⚡ Быстрая настройка Gmail - 5 минут

## 🎯 Проблема:
Gmail sync не работает потому что нет OAuth токенов.

## ✅ Решение за 5 минут:

### Шаг 1: Получить Google Cloud Project (2 минуты)

1. Открой: https://console.cloud.google.com/
2. Создай новый проект или выбери существующий
3. **APIs & Services** → **Enable APIs and Services**
4. Найди "Gmail API" → Enable

### Шаг 2: Создать OAuth Client ID (2 минуты)

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
2. Если просит - настрой OAuth consent screen:
   - User Type: **External**
   - App name: `LeaseAI`
   - User support email: твой email
   - Developer contact: твой email
   - Сохрани
3. Вернись: **Create Credentials** → **OAuth Client ID**
4. Application type: **Web application**
5. Name: `LeaseAI Gmail`
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/gmail/callback
   ```
7. Нажми **Create**
8. **Скопируй Client ID и Client Secret** ✅

### Шаг 3: Добавить в .env.local (1 минута)

Открой `/Users/assylzhantati/Downloads/realtoros/.env.local` и добавь:

```bash
# Gmail OAuth (добавь эти строки)
GOOGLE_CLIENT_ID=твой-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=твой-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback
```

---

## 🧪 Как протестировать (без полного OAuth):

### Вариант A: Тестовые данные (быстро)

Пока Gmail не работает - используй **"New Conversation"** для ручного добавления лидов:

1. Открой Inbox
2. Нажми "New Conversation"
3. Заполни форму (как будто это email)
4. Source выбери "Email"
5. Отправь

Это создаст тестового лида в БД! ✅

### Вариант B: Настроить полный OAuth (если очень нужен Gmail sync)

Я могу создать OAuth flow endpoints, но это займет еще 15 минут.

---

## 💡 Рекомендация:

**Пока что**: Используй ручное добавление лидов через "New Conversation"

**Позже**: Когда будут первые пользователи - настроим полный Gmail OAuth

---

## 📊 Что работает БЕЗ Gmail:

✅ Добавление лидов вручную  
✅ Просмотр conversations  
✅ Ответы на сообщения  
✅ Фильтры по источникам  
✅ AI Assistant для генерации ответов  

Gmail нужен только для **автоматического импорта** email.

---

**Хочешь чтобы я создал полный OAuth flow?** (займет 15 мин)
