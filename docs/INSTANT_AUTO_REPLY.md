# ⚡ INSTANT AUTO-REPLY SYSTEM

## 🎯 Overview

**Никогда не теряйте лиды из-за медленного ответа!**

Система автоматически отвечает на КАЖДОЕ новое письмо в течение секунд после получения. AI начинает квалификацию немедленно, пока конкуренты еще спят.

---

## 🚀 How It Works

### **Полностью Автоматический Workflow:**

```
1. 📧 Email arrives → Gmail
2. 🤖 AI filters spam (only real leads processed)
3. ✅ AI parses lead data
4. 💾 Saves to database
5. 🤖 AI generates personalized response
6. 📨 Email sent automatically via Gmail
7. 💬 Response saved to inbox
8. ⏱️ Total time: 3-5 seconds!
```

### **Клиент получает:**
- ✅ Instant response (секунды, не часы!)
- ✅ Personalized message (с его именем, про его запрос)
- ✅ Professional tone (как от настоящего риэлтора)
- ✅ Starts qualification (первые вопросы сразу)

---

## 📊 Technical Implementation

### **1. Gmail API Integration**

**Function:** `sendEmail()` in `lib/gmail.ts`

```typescript
await sendEmail(
  to: 'client@example.com',
  subject: 'Re: Your property inquiry',
  body: 'AI generated response...',
  options: {
    threadId: '<gmail-thread-id>', // Keeps conversation together
    inReplyTo: '<message-id>', // Proper email threading
  }
);
```

**Features:**
- ✅ RFC 2822 compliant format
- ✅ Proper email threading (In-Reply-To header)
- ✅ Base64url encoding
- ✅ Automatic "From" address detection

---

### **2. Smart Auto-Reply Function**

**Function:** `sendAutoReply()` in `lib/gmail.ts`

```typescript
await sendAutoReply(
  leadEmail: 'client@example.com',
  leadName: 'John Doe',
  replyMessage: 'AI response...',
  options: {
    threadId: '<thread-id>',
    messageId: '<message-id>',
    subject: 'Property at 123 Main St',
  }
);
```

Automatically handles:
- ✅ Subject line formatting (`Re:` prefix)
- ✅ Gmail threading (keeps conversation in one thread)
- ✅ Error handling

---

### **3. Updated Gmail Sync API**

**File:** `app/api/gmail/sync/route.ts`

**New Logic:**

```typescript
for (const lead of leads) {
  // 1. Create tenant
  const tenant = await createTenant({
    ...lead,
    gmail_thread_id: lead.threadId, // ← For threading
    gmail_message_id: lead.messageId, // ← For replies
    auto_reply_enabled: true, // ← Auto-reply ON by default
  });
  
  // 2. Save client message
  await saveMessage(lead.message);
  
  // 3. Generate AI response
  const aiResponse = await generateQualificationResponse({
    tenant,
    properties: realtorProperties,
    conversationHistory: [{ role: 'user', content: lead.message }],
  });
  
  // 4. Send email automatically
  await sendAutoReply(
    lead.tenant_email,
    lead.tenant_name,
    aiResponse.response,
    { threadId: lead.threadId, messageId: lead.messageId }
  );
  
  // 5. Save AI response to inbox
  await saveMessage(aiResponse.response, { is_ai_response: true });
  
  // 6. Update tenant with extracted data
  await updateTenant(aiResponse.extractedData);
}
```

---

### **4. Database Fields**

**New Fields in `tenants` table:**

```sql
-- Gmail threading
gmail_thread_id TEXT          -- Gmail thread ID for threading
gmail_message_id TEXT         -- Original message ID

-- Auto-reply tracking
last_auto_reply_at TIMESTAMP  -- When last auto-reply was sent
auto_reply_enabled BOOLEAN    -- Toggle auto-reply per conversation
```

---

## 💡 Example Scenarios

### **Scenario 1: Zillow Inquiry**

**Client Email (via Zillow):**
```
Subject: Interested in 2BR at 123 Main Street

Hi, I saw your listing on Zillow. Is this property still available?
I'm looking for a place to move in by March 1st.

- John Doe
```

**AI Auto-Reply (sent in 3 seconds):**
```
Subject: Re: Interested in 2BR at 123 Main Street

Hi John!

Thank you so much for your interest in the 2BR at 123 Main Street! 
Yes, it's still available and perfect for a March 1st move-in. 🏠

To show you the best options, could you tell me:
- What's your budget range?
- Will you be moving alone or with family?
- Do you have any pets?

I'd be happy to schedule a viewing this week if you're interested!

Best regards,
[Your Name]
Real Estate Agent
```

**Result:**
- ✅ Client gets response in seconds
- ✅ Feels valued and prioritized
- ✅ Qualification starts immediately
- ✅ Higher chance of booking viewing

---

### **Scenario 2: Direct Email**

**Client Email:**
```
Subject: Question about rental at Oak Avenue

Hello,

I'm looking for a 2BR apartment with parking for my family (2 adults + dog).
Budget is around $2,500/month. Do you have anything available?

Thanks,
Sarah
```

**AI Auto-Reply:**
```
Subject: Re: Question about rental at Oak Avenue

Hi Sarah!

Great to hear from you! I have a few excellent options for you and your family. 🏠

I have 2BR apartments with parking in your budget range. Since you have a dog, 
I'll make sure to show you only pet-friendly buildings.

Quick questions:
- What size is your dog? (Some buildings have weight limits)
- When are you looking to move?
- Any must-have amenities? (gym, laundry in-unit, etc.)

I can show you 2-3 great places this week. Which days work best for you?

Looking forward to helping you find the perfect home!

Best,
[Your Name]
```

**What AI Did:**
- ✅ Extracted: bedrooms=2, budget=2500, has_pets=true, pet_type="dog"
- ✅ Mentioned parking (client's requirement)
- ✅ Proactively addressed pet policy
- ✅ Started qualification (dog size, timeline)
- ✅ Proposed next step (viewing)

---

## 🎛️ Configuration & Control

### **1. Enable/Disable Per Conversation**

You can turn off auto-reply for specific clients:

```sql
UPDATE tenants 
SET auto_reply_enabled = false 
WHERE id = '<tenant-id>';
```

Use cases:
- VIP clients (want manual personalization)
- Complex situations (need human judgment)
- Client requested no auto-replies

---

### **2. Monitor Auto-Replies**

**Check last auto-reply:**

```sql
SELECT 
  name,
  email,
  last_auto_reply_at,
  auto_reply_enabled
FROM tenants
WHERE last_auto_reply_at IS NOT NULL
ORDER BY last_auto_reply_at DESC;
```

---

### **3. Sync Response Includes Stats**

```json
{
  "success": true,
  "synced": 5,         // Emails checked
  "created": 3,        // New leads saved
  "autoRepliesSent": 3 // Auto-replies sent ⚡
}
```

---

## ✅ Benefits

### **For Realtor:**

1. **Never Miss a Lead**
   - Instant response 24/7
   - Works while you sleep
   - Works while you're showing properties

2. **Higher Conversion**
   - Fast response = higher engagement
   - Clients feel prioritized
   - Beats competition who responds in hours/days

3. **Time Saved**
   - No manual first replies
   - AI handles initial qualification
   - You focus on high-value activities (viewings, closings)

4. **Better Data**
   - Qualification starts immediately
   - Lead score updated automatically
   - Inbox organized by priority

---

### **For Client:**

1. **Immediate Acknowledgment**
   - "Someone is listening!"
   - Reduces anxiety
   - Builds trust

2. **Personalized Response**
   - Uses their name
   - References their specific inquiry
   - Answers their questions

3. **Clear Next Steps**
   - What information is needed
   - When they can expect viewing
   - How to proceed

---

## 🧪 Testing

### **Step 1: Run Database Migration**

```sql
-- In Supabase SQL Editor:
-- Run: supabase/add-gmail-threading-fields.sql
```

### **Step 2: Send Test Email**

Send yourself an email (to your synced Gmail):

```
Subject: Test - Interested in your property

Hi! I saw your listing online. Is it available for rent?
I'm looking to move in next month. Budget is $2,000-$2,500.

Thanks,
Test User
```

### **Step 3: Trigger Sync**

In your app, click **"Sync Gmail"** button.

### **Step 4: Check Results**

1. **In Inbox:**
   - ✅ Should see new conversation with Test User
   - ✅ Should see TWO messages:
     - Client's original message
     - AI auto-reply (marked as "AI Draft")

2. **In Your Gmail:**
   - ✅ Check "Sent" folder
   - ✅ Should see auto-reply email sent

3. **Check Email Inbox:**
   - ✅ You should receive the auto-reply
   - ✅ Should be properly threaded (same conversation)

4. **In Supabase:**

```sql
SELECT 
  t.name,
  t.email,
  t.gmail_thread_id,
  t.last_auto_reply_at,
  COUNT(m.id) as message_count
FROM tenants t
LEFT JOIN messages m ON m.tenant_id = t.id
WHERE t.email = 'your-test-email@example.com'
GROUP BY t.id;
```

Should show:
- `gmail_thread_id`: (populated)
- `last_auto_reply_at`: (recent timestamp)
- `message_count`: 2 (client message + AI reply)

---

## 🚨 Troubleshooting

### **Issue: Auto-reply not sent**

**Check:**
1. Gmail API credentials valid? (`GMAIL_REFRESH_TOKEN` in `.env.local`)
2. Gmail API "Send" permission enabled? (in Google Cloud Console)
3. Check server logs for errors
4. Verify `auto_reply_enabled = true` in database

**Solution:**
```bash
# Re-authorize Gmail with "send" scope
# Visit: http://localhost:3000/api/gmail/auth
```

---

### **Issue: Email not threaded properly**

**Check:**
1. `gmail_thread_id` saved in database?
2. `In-Reply-To` header included in email?

**Solution:**
```sql
-- Verify threading data
SELECT gmail_thread_id, gmail_message_id 
FROM tenants 
WHERE id = '<tenant-id>';
```

---

### **Issue: AI response quality poor**

**Check:**
1. `OPENAI_API_KEY` valid?
2. Properties available in database? (AI needs context)
3. Lead message has enough information?

**Improve:**
- Add more properties to database
- Ensure property fields are filled (amenities, pet_policy, etc.)
- Check AI prompts in `lib/ai-qualification.ts`

---

## 📈 Metrics to Track

### **Response Time**
- **Before:** 2-24 hours (manual)
- **After:** 3-5 seconds (auto) ⚡

### **Conversion Rate**
- Fast response → Higher engagement
- Track: viewing requests per lead

### **Time Saved**
- No manual first replies
- ~5 minutes saved per lead
- 20 leads/day = 100 minutes saved!

---

## 🎯 Best Practices

### **1. Keep Properties Updated**
- AI suggests properties from your database
- Outdated listings = poor suggestions
- Update status regularly (Active/Rented/Sold)

### **2. Review AI Responses**
- Check inbox to see what AI sent
- Adjust prompts if needed
- Disable auto-reply for complex cases

### **3. Monitor Lead Quality**
- Check `lead_score` and `lead_quality`
- Focus on "hot" leads first
- AI auto-qualifies in background

### **4. Follow Up Manually**
- AI starts conversation
- You close the deal
- Personal touch for viewings/contracts

---

## 🔮 Future Enhancements

### **V2 Features:**

1. **Webhook-Based (Real-time)**
   - Gmail Pub/Sub webhook
   - Auto-reply within 1 second
   - No need to click "Sync"

2. **Multi-Round Auto-Replies**
   - Client responds to AI
   - AI responds again automatically
   - Fully automated qualification

3. **Smart Send Times**
   - Don't send at 3 AM
   - Respect time zones
   - Queue for business hours

4. **A/B Testing**
   - Test different response styles
   - Measure which converts better
   - Auto-optimize prompts

5. **Integration with Calendar**
   - AI proposes viewing times
   - Client clicks link to book
   - Automatically added to your calendar

---

## 🎉 Summary

**What You Have Now:**

✅ **Instant auto-reply** to all new leads  
✅ **Smart AI qualification** starts immediately  
✅ **Proper email threading** (conversations stay organized)  
✅ **Automatic data extraction** (no manual entry)  
✅ **Lead scoring** (prioritize hot leads)  
✅ **Property matching** (AI suggests best fits)  
✅ **Full conversation history** (all in your inbox)  

**Result:**
- 🚀 **10x faster response time**
- 💰 **Higher conversion rate**
- ⏰ **More time for viewings/closings**
- 😊 **Happier clients**

---

**Never lose a lead again! ⚡**
