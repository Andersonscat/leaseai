# 🔐 Social Login Setup Guide

## ✅ Что мы добавили:

На страницах `/login` и `/signup` теперь есть кнопки:
- 🔵 **Google** - Continue with Google
- 🔵 **Facebook** - Continue with Facebook  
- ⚫ **GitHub** - Continue with GitHub
- 🍎 **Apple** - Continue with Apple

---

## 🚀 Как настроить (в Supabase Dashboard):

### 📍 **Шаг 1: Открой Supabase Dashboard**

👉 https://supabase.com/dashboard/project/aifbyfmzrlthmqlepxhk/auth/providers

---

## 1️⃣ **Google OAuth** (Рекомендую начать с этого!)

### A. Создай Google OAuth App:
1. Перейди: https://console.cloud.google.com/
2. Создай новый проект (или выбери существующий)
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
4. Application type: **Web application**
5. Name: `LeaseAI`
6. **Authorized redirect URIs**: 
   ```
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```
7. Скопируй **Client ID** и **Client Secret**

### B. Настрой в Supabase:
1. Открой: https://supabase.com/dashboard/project/aifbyfmzrlthmqlepxhk/auth/providers
2. Найди **Google**
3. Включи переключатель (**Enable**)
4. Вставь **Client ID**
5. Вставь **Client Secret**
6. Нажми **Save**

✅ Готово! Google login работает!

---

## 2️⃣ **GitHub OAuth**

### A. Создай GitHub OAuth App:
1. Перейди: https://github.com/settings/developers
2. **OAuth Apps** → **New OAuth App**
3. Application name: `LeaseAI`
4. Homepage URL: `http://localhost:3000` (или твой домен)
5. **Authorization callback URL**:
   ```
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```
6. Скопируй **Client ID** и **Client Secret**

### B. Настрой в Supabase:
1. Открой провайдеры
2. Найди **GitHub**
3. Включи (**Enable**)
4. Вставь **Client ID** и **Client Secret**
5. **Save**

✅ GitHub login работает!

---

## 3️⃣ **Facebook OAuth**

### A. Создай Facebook App:
1. Перейди: https://developers.facebook.com/apps/
2. **Create App** → **Consumer**
3. App Name: `LeaseAI`
4. **Add Product** → **Facebook Login** → **Settings**
5. **Valid OAuth Redirect URIs**:
   ```
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```
6. Скопируй **App ID** и **App Secret** (Settings → Basic)

### B. Настрой в Supabase:
1. Открой провайдеры
2. Найди **Facebook**
3. Включи (**Enable**)
4. Вставь **Client ID** (App ID) и **Client Secret**
5. **Save**

✅ Facebook login работает!

---

## 4️⃣ **Apple OAuth** (Advanced)

### A. Создай Apple Service ID:
1. Перейди: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Зарегистрируй **App ID**
3. Создай **Services ID**
4. Configure **Sign in with Apple**
5. Return URLs:
   ```
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```

### B. Настрой в Supabase:
1. Открой провайдеры
2. Найди **Apple**
3. Включи (**Enable**)
4. Вставь credentials
5. **Save**

⚠️ **Apple OAuth требует платный Apple Developer Account ($99/год)**

---

## 🎯 Рекомендации:

### Для начала:
1. ✅ **Google** - самый простой и популярный (начни с него!)
2. ✅ **GitHub** - отлично для tech-аудитории
3. ⏭️ **Facebook** - можно добавить позже
4. ⏭️ **Apple** - требует $99/год, добавь когда будешь готов к production

---

## 🧪 Тестирование:

### После настройки Google:
1. Открой: http://localhost:3000/signup
2. Нажми "Continue with Google"
3. Выбери Google аккаунт
4. ✅ Должно перенаправить на `/dashboard`

---

## 🔧 URL Configuration в Supabase:

Убедись что в **Authentication** → **URL Configuration** настроено:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: 
  ```
  http://localhost:3000/**
  http://localhost:3000/dashboard
  ```

---

## 🚀 Production Setup:

Когда будешь деплоить на продакшн, обнови:

1. **Google OAuth** → Authorized redirect URIs:
   ```
   https://yourdomain.com/auth/callback
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```

2. **Supabase** → Site URL:
   ```
   https://yourdomain.com
   ```

---

## 💡 FAQ:

**Q: Можно ли сначала настроить только Google?**  
✅ Да! Остальные кнопки просто не будут работать.

**Q: Что если нажать на неактивированную кнопку?**  
⚠️ Покажет ошибку. Но это не критично.

**Q: Сколько времени занимает настройка?**  
- Google: ~5 минут
- GitHub: ~3 минуты
- Facebook: ~10 минут
- Apple: ~30+ минут

---

**Начни с Google - это проще всего!** 🎯
