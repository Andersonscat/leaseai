# ⚡ Быстрое исправление OAuth

## Проблема
Ошибка: `provider is not enabled` при попытке войти через Google/Facebook/etc

## Решение

### Вариант 1: Настроить Google OAuth (Рекомендуется)

**Время: 10 минут**

1. Зайдите в Google Cloud Console: https://console.cloud.google.com/
2. Создайте проект
3. OAuth consent screen → External
4. Credentials → Create OAuth Client ID → Web application
5. Authorized redirect URI:
   ```
   https://aifbyfmzrlthmqlepxhk.supabase.co/auth/v1/callback
   ```
6. Скопируйте Client ID и Secret
7. Supabase Dashboard → Authentication → Providers → Google
8. Включите и вставьте ключи
9. Перезапустите: `npm run dev`

**Подробная инструкция:** см. OAUTH_SETUP.md

---

### Вариант 2: Временно отключить OAuth кнопки

**Время: 1 минута**

Убрать кнопки пока не настроите провайдеры.
Я могу сделать это автоматически!

---

## Что выбрать?

- **Нужен социальный вход?** → Вариант 1 (Google OAuth)
- **Пока только email/password?** → Вариант 2 (убрать кнопки)

---

**Email/Password работает БЕЗ настройки!**
Просто регистрируйтесь через форму с email.
