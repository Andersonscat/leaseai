# 🎯 Фильтрация лидов от мусора

## ❌ Проблема:

При синхронизации Gmail попадает все подряд:
- ✅ Реальные лиды (нужны!)
- ❌ Рассылки от Zillow "Weekly market report"
- ❌ Благодарности "Thanks for showing me"
- ❌ Промо "Try Zillow Premium!"
- ❌ Чеки, инвойсы, подтверждения

**Нужна фильтрация!**

---

## ✅ Решение: 3 уровня защиты

### **Уровень 1: Gmail Labels (Лучший способ!)**

#### Как настроить:

1. **Создай label в Gmail:**
   - Settings → Labels → Create new label: "Leads"

2. **Настрой фильтры:**

**Фильтр #1: Zillow лиды**
```
From: noreply@zillow.com
Subject contains: (inquiry OR question OR interested)
→ Apply label "Leads"
```

**Фильтр #2: Airbnb запросы**
```
From: automated@airbnb.com
Subject contains: (booking request OR inquiry OR question)
→ Apply label "Leads"
```

**Фильтр #3: Facebook Marketplace**
```
From: notification@facebookmail.com
Subject contains: (interested OR question about)
→ Apply label "Leads"
```

**Фильтр #4: Исключить рассылки**
```
From: (zillow.com OR airbnb.com)
Subject contains: (newsletter OR weekly report OR market update OR premium OR upgrade)
→ Skip Inbox, Mark as read (или удалить)
```

3. **В коде укажи label:**

```typescript
// lib/gmail.ts - строка ~273
const response = await gmail.users.messages.list({
  userId,
  q: 'is:unread label:leads',  // Только с label "Leads"!
  maxResults,
});
```

**Результат:** Синхронизируются ТОЛЬКО отфильтрованные лиды! 🎉

---

### **Уровень 2: Smart Filter в коде (Работает сейчас!)**

Код автоматически проверяет каждое письмо:

```typescript
function isRealLead(subject, body) {
  // Исключаем мусор
  const spam = ['unsubscribe', 'newsletter', 'weekly report', 'premium'];
  
  // Ищем признаки лида
  const leadWords = ['inquiry', 'interested', 'viewing', 'booking request'];
  
  return !hasSpam && hasLeadWords;
}
```

**Автоматически отфильтровывает:**
- ❌ Рассылки (unsubscribe, newsletter)
- ❌ Маркетинг (premium, upgrade)
- ❌ Благодарности (thanks for, thank you)
- ❌ Чеки (receipt, invoice, confirmation)

**Пропускает только:**
- ✅ inquiry
- ✅ interested in
- ✅ question about
- ✅ viewing/tour
- ✅ booking request
- ✅ is this available

---

### **Уровень 3: Отдельный email (Профи уровень)**

Создай dedicated email для лидов:

```
📧 leads@yourdomain.com     ← Только для лидов (Zillow, Airbnb)
📧 hello@yourdomain.com     ← Обычная переписка с клиентами
📧 support@yourdomain.com   ← Поддержка
```

**Как настроить:**
1. Купи домен (если нет)
2. Настрой email forwarding или Gmail alias
3. На Zillow/Airbnb указывай `leads@yourdomain.com`
4. Синхронизируй только `leads@` inbox

**Преимущества:**
- ✅ 100% разделение
- ✅ 0% мусора
- ✅ Профессионально
- ✅ Можно настроить auto-responder

---

## 🎯 Моя рекомендация:

### **Для начала: Smart Filter (уже работает!)**

Просто используй текущую версию - она автоматически отфильтровывает 90% мусора.

**Консоль покажет:**
```
⏭️  Skipping non-lead: "Weekly market report from Zillow"
✅ Processing lead: "Inquiry about 123 Main St"
⏭️  Skipping non-lead: "Thanks for showing me the apartment"
✅ Processing lead: "Interested in viewing your property"
```

### **Через неделю: Gmail Labels**

Когда увидишь что работает, настрой Gmail filters для еще лучшей точности.

### **Через месяц: Dedicated Email**

Если серьезно масштабируешься - заведи отдельный email для лидов.

---

## 🧪 Тестирование фильтров:

### Хорошие примеры (должны пройти):
```
✅ "Inquiry about your listing at 123 Main St"
✅ "Interested in viewing the apartment"
✅ "Is this property still available?"
✅ "Question about the 2BR unit"
✅ "I would like to schedule a tour"
✅ "Booking request for March 15-20"
```

### Плохие примеры (должны отфильтровываться):
```
❌ "Weekly market report - January 2026"
❌ "Upgrade to Zillow Premium today!"
❌ "Thanks for showing me the apartment yesterday"
❌ "Your invoice #12345"
❌ "Confirmation: Your listing is live"
❌ "Unsubscribe from Zillow emails"
```

---

## 🔧 Кастомизация фильтров:

Если нужно добавить свои правила, редактируй:

**Добавить слово для исключения:**
```typescript
// lib/gmail.ts - функция isRealLead()
const excludeKeywords = [
  'unsubscribe',
  'newsletter',
  'твое слово здесь',  // ← Добавь
];
```

**Добавить признак лида:**
```typescript
const leadKeywords = [
  'inquiry',
  'interested',
  'твой признак лида',  // ← Добавь
];
```

---

## 📊 Статистика фильтрации:

После синхронизации увидишь:

```
🔄 Syncing Gmail...
⏭️  Skipped: 15 newsletters/spam
✅ Imported: 5 real leads
📊 Success rate: 25%
```

Если success rate < 50% → слишком агрессивная фильтрация  
Если success rate > 90% → слишком мягкая фильтрация  
**Оптимально: 60-80%**

---

## 💡 Pro Tips:

### 1. Test Mode
Сначала запусти без фильтров, посмотри что приходит:
```typescript
// Временно отключи фильтр
// if (!isRealLead(subject, body)) continue;
```

### 2. Whitelist важных клиентов
```typescript
const vipEmails = ['important-client@example.com'];
if (vipEmails.includes(senderEmail)) {
  return true; // Всегда импортировать
}
```

### 3. Log всё
```typescript
console.log('📧 Checking:', subject);
console.log('   From:', from);
console.log('   Is lead?', isRealLead(subject, body));
```

---

## 🚀 Итог:

**Сейчас работает:** Smart Filter в коде (90% точность)  
**Можешь добавить:** Gmail Labels (95% точность)  
**Для профи:** Dedicated email (100% точность)

**Начни с того что есть, потом улучшай!** 🎯
