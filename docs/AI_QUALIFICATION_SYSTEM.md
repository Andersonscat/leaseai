# 🤖 AI SMART QUALIFICATION SYSTEM

## 📋 Overview

This system transforms your inbox into an intelligent lead qualification machine that:
- ✅ Automatically qualifies leads through natural conversation
- ✅ Scores leads (0-15 points) based on qualification criteria  
- ✅ Categorizes leads as **Hot** 🔥, **Warm** 🌤️, or **Cold** 🧊
- ✅ Matches qualified clients with available properties
- ✅ Extracts structured data from unstructured conversations
- ✅ Adapts questions based on what information is still needed

---

## 🎯 How It Works

### **Stage 1: Initial Contact**
When a lead first messages you, AI asks **3-4 key questions**:
- What property are they interested in?
- Budget range?
- When are they looking to move?
- What type of property? (apartment, house, etc.)

**Example conversation:**
```
Client: "Hi, I saw your listing on Zillow for the 2BR at 123 Main St"

AI: "Hi! I'm so glad you're interested in that property. It's a beautiful 
     2BR apartment and it's still available! To show you the best options, 
     could you tell me your budget range and when you're planning to move?"

Client: "$2,000-$2,500/month, looking to move by March 1st"

AI: [✅ Extracted: budget_min=2000, budget_max=2500, move_in_date=2026-03-01]
    "Perfect! That timeline works great. Do you have any pets?"
```

---

### **Stage 2: Deep Qualification**
AI gradually collects more details over 3-5 messages:
- Number of bedrooms/bathrooms
- Must-have amenities (gym, parking, laundry, etc.)
- Pet information (type, size, breed)
- Preferred neighborhoods
- Deal breakers
- Parking needs
- Employment status

**The AI is smart:**
- ❌ Won't ask all questions at once (no interrogation!)
- ✅ Asks 2-3 questions naturally in each message
- ✅ Explains WHY it's asking (builds trust)
- ✅ Adapts based on client's answers

**Example:**
```
AI: "To make sure I show you pet-friendly buildings, could you tell me 
     what kind of pet you have and their size?"
     
Client: "I have a medium-sized Labrador, about 60 lbs"

AI: [✅ Extracted: has_pets=true, pet_type="dog", pet_size="medium"]
    "Great! We have several dog-friendly buildings. Do you need parking, 
     or will you rely on public transportation?"
```

---

### **Stage 3: Property Matching**
Once enough information is collected (Lead Score ≥ 6), AI:
1. **Searches your properties database**
2. **Filters by:**
   - Budget match
   - Bedroom count
   - Pet policy
   - Required amenities
   - Availability date
3. **Suggests top 2-3 matching properties**
4. **Explains why they match**

**Example:**
```
AI: "I have two great options for you:

    1. 📍 123 Main Street, Apt 2B
       • $2,400/month | 2BR/1BA | 950 sqft
       • Pet-friendly (dogs up to 80 lbs)
       • In-unit laundry + doorman
       • Available March 1st
       
    2. 📍 456 Oak Avenue, Unit 3A  
       • $2,350/month | 2BR/1BA | 1,000 sqft
       • Dogs welcome
       • Parking included + gym
       • Available Feb 15th
       
    Both are within your budget and allow pets! Would you like to schedule 
    viewings for this week?"
```

---

### **Stage 4: Viewing Scheduled**
AI proposes viewing times and confirms details:
```
AI: "I have availability this week:
     • Wednesday, Jan 22 at 3:00 PM
     • Thursday, Jan 23 at 5:30 PM
     • Friday, Jan 24 at 2:00 PM
     
     Which works best for you?"
     
Client: "Thursday at 5:30 works!"

AI: [✅ Sets viewing_date, updates status to 'viewing_scheduled']
    "Perfect! I've scheduled your viewing for Thursday, January 23rd at 
     5:30 PM at 123 Main Street, Apt 2B.
     
     Please bring:
     • Photo ID
     • Proof of income (last 2 paystubs)
     
     Looking forward to showing you the place! 🏠"
```

---

## 🏆 Lead Scoring System

### **Score Calculation (0-15 points)**

| Criteria | Points | Details |
|----------|--------|---------|
| **Budget Specified** | 0-3 | Both min & max = 3pts, One = 1pt |
| **Credit Score** | 0-3 | Excellent = 3, Good = 2, Fair = 1 |
| **Timeline** | 0-2 | Within 2 weeks = 2, Within 1 month = 1 |
| **Documents Ready** | 0-2 | Both income + reference = 2, One = 1 |
| **Property Requirements** | 0-2 | Beds + Type = 2, One = 1 |
| **Employment** | 0-2 | Employed = 2, Self-employed/Retired = 1 |
| **Flexibility** | 0-1 | No deal breakers = 1 |

### **Lead Quality Categories**

| Score | Quality | Priority | Action |
|-------|---------|----------|--------|
| **11-15** | 🔥 **HOT** | P1 | Match properties immediately, schedule viewing ASAP |
| **6-10** | 🌤️ **WARM** | P2 | Continue qualifying, gentle push toward viewing |
| **1-5** | 🧊 **COLD** | P3 | Low effort, automated follow-ups only |
| **0** | ❌ **Unqualified** | P4 | Archive or re-engage later |

---

## 📊 Database Fields

### **New Fields Added to `tenants` Table**

#### **Financial**
- `budget_min` (INTEGER)
- `budget_max` (INTEGER)
- `credit_score` (VARCHAR: excellent/good/fair/poor)
- `employment_status` (VARCHAR: employed/self_employed/student/retired)
- `needs_cosigner` (BOOLEAN)
- `move_in_budget` (INTEGER) - Total available for first+last+deposit

#### **Timeline**
- `move_in_date` (DATE)
- `lease_duration` (VARCHAR: 12_months/6_months/month_to_month)
- `urgency` (VARCHAR: high/medium/low)
- `reason_for_moving` (TEXT)

#### **Property Requirements**
- `bedrooms` (INTEGER)
- `bathrooms` (DECIMAL)
- `min_sqft`, `max_sqft` (INTEGER)
- `property_type` (VARCHAR: apartment/house/condo/townhouse)
- `furnishing` (VARCHAR: furnished/unfurnished/partial)

#### **Amenities & Location** (JSONB)
- `required_amenities` - Must-haves: `['gym', 'laundry_in_unit', 'doorman']`
- `preferred_amenities` - Nice-to-haves
- `preferred_neighborhoods` - `['Upper East Side', 'Brooklyn']`
- `max_commute_minutes` (INTEGER)
- `floor_preference` (VARCHAR: ground/high/no_preference)

#### **Lifestyle**
- `num_occupants` (INTEGER)
- `has_children` (BOOLEAN)
- `children_ages` (JSONB: `[5, 8, 12]`)
- `has_pets` (BOOLEAN)
- `pet_details` (JSONB: `[{type: 'dog', size: 'large', breed: 'Labrador'}]`)
- `is_smoker` (BOOLEAN)

#### **Utilities & Parking**
- `utilities_included_preference` (JSONB: `['water', 'heat', 'electricity']`)
- `needs_parking` (BOOLEAN)
- `parking_type` (VARCHAR: street/driveway/garage/reserved)
- `has_car` (BOOLEAN)
- `needs_ev_charging` (BOOLEAN)

#### **Must-Haves & Deal Breakers** (JSONB)
- `must_haves` - `['in_unit_laundry', 'allows_large_dogs']`
- `deal_breakers` - `['no_ground_floor', 'no_walk_ups']`

#### **Documentation**
- `has_photo_id` (BOOLEAN)
- `has_proof_of_income` (BOOLEAN)
- `has_landlord_reference` (BOOLEAN)
- `background_check_consent` (BOOLEAN)

#### **Lead Scoring**
- `lead_score` (INTEGER: 0-15)
- `lead_quality` (VARCHAR: hot/warm/cold/unqualified)
- `qualification_status` (VARCHAR: new/qualifying/qualified/viewing_scheduled/viewing_done/application_in_progress)
- `qualification_progress` (JSONB: tracks which sections are complete)

#### **Viewing**
- `viewing_date` (TIMESTAMP)
- `viewing_property_id` (UUID → properties)
- `viewing_completed` (BOOLEAN)
- `viewing_feedback` (TEXT)
- `interested_after_viewing` (BOOLEAN)

---

## 🛠️ Implementation Files

### **1. Database Migration**
📁 `supabase/add-qualification-fields.sql`
- Adds all new fields to `tenants` table
- Creates indexes for performance
- Adds `calculate_lead_score()` function
- Adds `update_lead_quality()` function
- Auto-trigger to update score on tenant changes

### **2. AI Qualification Logic**
📁 `lib/ai-qualification.ts`
- `generateQualificationResponse()` - Main AI function
- `calculateLeadScore()` - Scoring algorithm
- `getLeadQuality()` - Quality categorization
- `matchProperties()` - Property matching logic
- OpenAI Function Calling for structured data extraction

### **3. API Endpoint**
📁 `app/api/conversations/[tenantId]/auto-reply/route.ts`
- Fetches tenant + properties + conversation history
- Calls AI qualification system
- Extracts structured data from client messages
- Updates tenant record automatically
- Calculates and updates lead score
- Returns AI response + metadata

---

## 🚀 How to Deploy

### **Step 1: Run Database Migration**

Open Supabase SQL Editor and run:
```bash
# Copy contents of: supabase/add-qualification-fields.sql
```

This will:
- ✅ Add all new fields to `tenants` table
- ✅ Create indexes
- ✅ Add helper functions
- ✅ Set up auto-scoring trigger

### **Step 2: Restart Dev Server**

```bash
npm run dev
```

### **Step 3: Test the System**

1. **Send a test email** to your Gmail (that's synced)
2. **Open the inbox** - you should see the new lead
3. **Click on the conversation** to open chat
4. **Click "Generate AI Draft"** button
5. **Watch the magic!** 🪄
   - AI will ask smart qualification questions
   - Data will be extracted automatically
   - Lead score will update in real-time
   - Matching properties will be suggested

---

## 📈 Example Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 📧 EMAIL ARRIVES                                            │
│ "Hi, I saw your 2BR on Zillow at 123 Main St"             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI FILTERS & PARSES                                      │
│ ✅ Lead detected | Source: Zillow | Intent: Viewing        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 💬 CONVERSATION IN INBOX                                    │
│ Status: New | Score: 0/15 | Quality: Unqualified           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎯 REALTOR CLICKS "GENERATE AI DRAFT"                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI ASKS SMART QUESTIONS                                  │
│ "Hi! That property is available. What's your budget and     │
│  when are you looking to move?"                             │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 📊 CLIENT RESPONDS                                          │
│ "$2,000-$2,500/month, need to move by March 1st"           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ✨ AI EXTRACTS DATA AUTOMATICALLY                           │
│ budget_min: 2000                                            │
│ budget_max: 2500                                            │
│ move_in_date: 2026-03-01                                    │
│ urgency: high                                               │
│ ─────────────────────────────────────────────────────────── │
│ NEW SCORE: 6/15 | Quality: WARM 🌤️                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🏠 AI CONTINUES QUALIFICATION                               │
│ "Perfect timing! Do you have any pets? Need parking?"       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 📊 MORE DATA COLLECTED                                      │
│ has_pets: true (Labrador, medium)                           │
│ needs_parking: false                                        │
│ ─────────────────────────────────────────────────────────── │
│ NEW SCORE: 11/15 | Quality: HOT 🔥                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎯 AI MATCHES PROPERTIES                                    │
│ Found 2 matches:                                            │
│ • 123 Main St - $2,400 (pet-friendly)                       │
│ • 456 Oak Ave - $2,350 (pet-friendly + parking)            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 📅 AI PROPOSES VIEWING                                      │
│ "Would you like to see them this week? I have Wed 3pm,     │
│  Thu 5:30pm, or Fri 2pm available."                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ VIEWING SCHEDULED                                        │
│ Status: Viewing Scheduled                                   │
│ Date: Thursday 5:30 PM                                      │
│ Property: 123 Main St                                       │
│ ─────────────────────────────────────────────────────────── │
│ 🔔 REALTOR NOTIFIED                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 🏠 REALTOR SHOWS PROPERTY (Only human step!)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Key Features

### **1. Conversational, Not Robotic**
- ✅ Natural, friendly tone
- ✅ Explains why questions are asked
- ✅ 2-3 questions at a time (not overwhelming)
- ✅ Adapts based on client's responses

### **2. Multilingual**
- ✅ Auto-detects client's language
- ✅ Responds in same language
- ✅ Works with English, Russian, Spanish, etc.

### **3. Property Aware**
- ✅ AI "sees" your available properties
- ✅ Only suggests properties that match
- ✅ Explains why each property matches

### **4. Data Extraction**
- ✅ Uses OpenAI Function Calling
- ✅ Extracts structured data from natural conversation
- ✅ Automatically saves to database
- ✅ No manual data entry needed

### **5. Smart Prioritization**
- ✅ Auto-calculates lead score (0-15)
- ✅ Hot leads get immediate attention
- ✅ Cold leads get automated follow-ups
- ✅ Dashboard can sort by quality

### **6. Progressive Disclosure**
- ✅ Starts with quick questions (budget, timeline)
- ✅ Goes deeper as client engages
- ✅ Doesn't ask unnecessary questions
- ✅ Tracks what's already known

---

## 🎯 Next Steps

After this qualification system, you can add:

1. **Automated Viewing Reminders**
   - 24h before: "Reminder about tomorrow's viewing"
   - 2h before: "See you in 2 hours!"

2. **Post-Viewing Follow-up**
   - Next day: "How did the viewing go?"
   - If interested → Prepare application
   - If not → Suggest other properties

3. **Contract Generation**
   - AI fills out rental agreement template
   - Realtor reviews and approves
   - Send via DocuSign

4. **Analytics Dashboard**
   - Conversion rates by source (Zillow vs Realtor.com)
   - Average time from lead to viewing
   - Lead quality distribution
   - AI vs manual response effectiveness

---

## 🔧 Troubleshooting

### **Issue: AI not extracting data**
- Check OpenAI API key is set
- Check function calling is working (see logs)
- Verify client message has extractable info

### **Issue: Lead score not updating**
- Check database trigger is enabled
- Run `SELECT update_lead_quality('<tenant_id>')` manually
- Check `qualification_progress` field

### **Issue: No properties suggested**
- Check properties table has `status = 'Active'`
- Check property fields match tenant requirements
- Verify `allows_pets`, `parking_available` fields are set

---

## 📞 Support

For questions or issues:
- Check server logs for detailed error messages
- Use Supabase SQL Editor to inspect data
- Test with simple scenarios first

---

**Built with ❤️ using OpenAI GPT-4o-mini + Supabase + Next.js**
