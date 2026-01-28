# 💰 Стратегия монетизации для Unified Inbox

## ❌ ПРОБЛЕМА:

```
Парсинг email с AI = стоимость на каждый email
Пользователь НЕ контролирует сколько приходит
Может прийти 10, может 1000 в день

Если ты платишь за всех → БАНКРОТСТВО! 💀
```

---

## ✅ РЕШЕНИЕ: ТАРИФНЫЕ ПЛАНЫ С ЛИМИТАМИ

### **Модель SaaS с Usage-based Limits**

Как Mailchimp, Intercom, Stripe:
- Пользователь платит за план
- План имеет лимиты (emails/месяц)
- При превышении → предложение upgrade

---

## 📊 ПРЕДЛАГАЕМЫЕ ТАРИФЫ:

### 💚 **FREE (Hobby)**
**$0/месяц**

**Лимиты:**
- ✅ 50 emails парсинг/месяц
- ✅ 10 AI ассистент сообщений/месяц
- ✅ 5 properties
- ✅ 10 contracts
- ✅ Ручное добавление unlimited

**Твои расходы:** $0.10/месяц  
**Прибыль:** -$0.10/месяц (loss leader для привлечения)

---

### 💙 **STARTER (Small Landlord)**
**$29/месяц**

**Лимиты:**
- ✅ 500 emails парсинг/месяц
- ✅ 100 AI ассистент сообщений/месяц
- ✅ 25 properties
- ✅ 50 contracts
- ✅ Email support

**Твои расходы:** $0.30/месяц  
**Прибыль:** $28.70/месяц (99% margin) 💰

---

### 💜 **PRO (Professional)**
**$99/месяц** ⭐ Most Popular

**Лимиты:**
- ✅ 2,000 emails парсинг/месяц
- ✅ 500 AI ассистент сообщений/месяц
- ✅ 100 properties
- ✅ 200 contracts
- ✅ Priority support
- ✅ Advanced analytics

**Твои расходы:** $1.40/месяц  
**Прибыль:** $97.60/месяц (98.6% margin) 💰💰

---

### 🖤 **ENTERPRISE (Agency/Company)**
**$299/месяц** (или custom)

**Лимиты:**
- ✅ Unlimited emails парсинг
- ✅ Unlimited AI ассистент
- ✅ Unlimited everything
- ✅ Dedicated support
- ✅ White-label options
- ✅ Custom integrations

**Твои расходы:** ~$10-50/месяц (зависит от usage)  
**Прибыль:** $249-289/месяц (83-96% margin) 💰💰💰

---

## 💡 ПОЧЕМУ ЭТО РАБОТАЕТ:

### **Математика:**

```
Расходы на AI:
- Email парсинг: $0.0002 за email
- AI ассистент: $0.002 за сообщение

PRO план ($99/месяц):
- 2,000 emails × $0.0002 = $0.40
- 500 сообщений × $0.002 = $1.00
─────────────────────────────────
Твои расходы: $1.40
Доход: $99.00
Прибыль: $97.60 (98.6% margin!)
```

**Это ОГРОМНЫЙ margin для SaaS!** 🚀

### **Типичные SaaS margins:**
- Slack: ~90%
- Zoom: ~85%
- Intercom: ~90%
- **Твой продукт: ~98%!** 💎

---

## 🔒 КАК ЛИМИТИРОВАТЬ:

### **1. Database tracking:**

```sql
CREATE TABLE usage_stats (
  user_id UUID,
  feature VARCHAR,        -- 'emailParsing', 'aiAssistant'
  month VARCHAR,          -- '2026-01'
  count INTEGER,          -- Сколько использовано
  UNIQUE(user_id, feature, month)
);
```

### **2. Check before processing:**

```typescript
// Before parsing email
const usage = await checkUsageLimit(userId, 'emailParsing');

if (!usage.allowed) {
  return {
    error: 'Limit reached',
    message: `You've used ${usage.used}/${usage.limit} emails. Upgrade to continue.`,
    upgradeUrl: '/billing'
  };
}

// Parse email
await parseEmail();

// Increment counter
await incrementUsage(userId, 'emailParsing', 1);
```

### **3. UI показывает прогресс:**

```
Inbox header:
┌──────────────────────────────────┐
│ 💬 Inbox               [Sync]    │
│ 📊 345 / 2,000 emails this month │
│ ⚡ 87 / 500 AI messages          │
└──────────────────────────────────┘
```

---

## 🎯 USER EXPERIENCE:

### **Scenario 1: В пределах лимита**
```
User нажимает "Sync Gmail"
→ Emails парсятся
→ Появляются в Inbox
→ Счетчик увеличивается: 345 → 365
```

### **Scenario 2: Достиг 80% лимита**
```
User нажимает "Sync Gmail"
→ Emails парсятся
→ Warning banner:
   ⚠️ You've used 1,600/2,000 emails this month.
   Consider upgrading to PRO+ for unlimited.
```

### **Scenario 3: Превысил лимит**
```
User нажимает "Sync Gmail"
→ Modal появляется:

   ┌────────────────────────────────┐
   │ 🚫 Monthly Limit Reached       │
   │                                │
   │ You've used all 2,000 emails   │
   │ for January 2026.              │
   │                                │
   │ Options:                       │
   │ • Wait until Feb 1 (resets)    │
   │ • Upgrade to ENTERPRISE        │
   │ • Add manually (free)          │
   │                                │
   │ [Wait] [Upgrade Now →]         │
   └────────────────────────────────┘
```

---

## 🔄 АЛЬТЕРНАТИВНЫЕ МОДЕЛИ:

### **Вариант 2: Пользователь приносит свой API key**

```
User settings:
┌──────────────────────────────────┐
│ OpenAI API Key (optional)        │
│ [sk-proj-xxxxx...] [Save]        │
│                                  │
│ ✅ Using your own key            │
│ 💰 Saves $1.40/month             │
│ 📊 Unlimited usage               │
└──────────────────────────────────┘
```

**Плюсы:**
- ✅ Пользователь платит напрямую OpenAI
- ✅ Ты не несешь расходы
- ✅ Unlimited для пользователя

**Минусы:**
- ❌ Сложно для пользователя
- ❌ Барьер входа (нужен OpenAI аккаунт)
- ❌ Меньше контроля
- ❌ Хуже UX

---

### **Вариант 3: Pay-as-you-go**

```
User видит:
┌──────────────────────────────────┐
│ This month's usage:              │
│ • 1,234 emails × $0.001 = $1.23  │
│ • 567 AI msgs × $0.005 = $2.84   │
│ ─────────────────────────────     │
│ Total: $4.07                     │
│                                  │
│ [Add $10 credits]                │
└──────────────────────────────────┘
```

**Плюсы:**
- ✅ Fair pricing (платишь за что используешь)
- ✅ Нет waste

**Минусы:**
- ❌ Непредсказуемо для пользователя
- ❌ Сложнее для billing
- ❌ Хуже retention (забывают пополнить)

---

### **Вариант 4: Гибридная модель** ⭐

```
PLANS:
• FREE: 50 emails/месяц (включено)
• STARTER: 500 emails/месяц (включено)
• PRO: 2,000 emails/месяц (включено)

+ OVERAGE:
Если превысил → $0.001 за дополнительный email

Пример:
PRO user использовал 2,500 emails
• 2,000 включено в план
• 500 overage × $0.001 = $0.50
• Итого счет: $99 + $0.50 = $99.50
```

**Плюсы:**
- ✅ Предсказуемо (базовый план)
- ✅ Гибко (не блокирует при превышении)
- ✅ Fair (платишь за extra)

**Минусы:**
- ⚠️ Чуть сложнее для расчета

---

## 🎯 МОЯ РЕКОМЕНДАЦИЯ:

### **Комбинация: Тарифы + BYOK (Bring Your Own Key)**

```
PLANS:
┌──────────────────────────────────┐
│ 💜 PRO Plan - $99/месяц          │
│ ✅ 2,000 emails included         │
│ ✅ 500 AI messages included      │
│                                  │
│ OR                               │
│                                  │
│ 🔑 Use your OpenAI key           │
│ ✅ Unlimited usage               │
│ 💰 You pay OpenAI directly       │
│                                  │
│ Choose: [Use Plan] [Use Own Key]│
└──────────────────────────────────┘
```

**Почему это лучше всего:**

1. **Простым пользователям:** Выбирают план, всё включено
2. **Power users:** Приносят свой ключ, unlimited
3. **Ты защищен:** Не несешь убытки
4. **Гибкость:** Каждый выбирает что хочет

---

## 📊 ОЖИДАЕМОЕ РАСПРЕДЕЛЕНИЕ:

```
100 пользователей:

💚 FREE: 60 users (60%)
   Доход: $0
   Расходы: $6/месяц
   Profit: -$6/месяц
   
💙 STARTER: 25 users (25%)
   Доход: $725/месяц
   Расходы: $7.50/месяц
   Profit: $717.50/месяц
   
💜 PRO: 12 users (12%)
   Доход: $1,188/месяц
   Расходы: $16.80/месяц
   Profit: $1,171.20/месяц
   
🖤 ENTERPRISE: 3 users (3%)
   Доход: $897/месяц
   Расходы: $30/месяц
   Profit: $867/месяц
   
───────────────────────────────────
TOTAL: 100 users
Доход: $2,810/месяц
Расходы: $60.30/месяц
Profit: $2,749.70/месяц (97.9% margin!)
```

**MRR: $2,810** 🚀  
**ARR: $33,720** 💰

---

## 🚀 МАСШТАБИРОВАНИЕ:

```
1,000 пользователей:
MRR: $28,100
ARR: $337,200
Расходы: $603/месяц
Profit: $27,497/месяц

10,000 пользователей:
MRR: $281,000
ARR: $3,372,000
Расходы: $6,030/месяц
Profit: $274,970/месяц
```

**С таким margin легко масштабируется!** 🚀

---

## 🎓 BEST PRACTICES:

### **1. Soft Limits (Рекомендую!)**
```
При 80% лимита → Warning
При 100% лимита → Предложение upgrade
При 110% лимита → Блокировка sync (но не удаление данных!)
```

### **2. Transparent Pricing**
```
Показывай пользователю:
• Сколько использовано
• Сколько осталось
• Сколько стоит upgrade
• Когда сбросится (1st день месяца)
```

### **3. Grandfathered Users**
```
Если меняешь цены → старые пользователи остаются на старых
Builds loyalty
```

### **4. Annual Discount**
```
Monthly: $99/месяц = $1,188/год
Annual: $999/год (save $189 = 16% off)

Больше upfront cash
Меньше churn
```

---

## 💡 ИТОГ:

**РЕКОМЕНДУЮ:**

✅ **Тарифные планы с лимитами** (как в файле)  
✅ **+ Опция BYOK** (для power users)  
✅ **Soft limits** (warning перед блокировкой)  
✅ **Transparent usage** (показывать счетчики)  
✅ **Annual discount** (16% off)

**НЕ РЕКОМЕНДУЮ:**

❌ Платить за всех пользователей (банкротство!)  
❌ Pay-as-you-go (плохой UX)  
❌ Только BYOK (барьер входа)

---

**С такой моделью у тебя 98% margin и защита от убытков!** 🛡️💰
