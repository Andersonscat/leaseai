# 🔒 RLS (Row Level Security) Setup Guide

## ✅ What we just configured:

1. ✅ Updated ALL API routes to use authenticated Supabase client
2. ✅ Created SQL file with comprehensive RLS policies
3. ✅ Each user can ONLY see/edit their OWN data

---

## 🚀 How to Apply RLS:

### **Step 1: Open Supabase SQL Editor**

👉 https://supabase.com/dashboard/project/aifbyfmzrlthmqlepxhk/sql/new

### **Step 2: Copy & Paste SQL**

1. Open the file: `supabase/enable-rls.sql`
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click **"RUN"** button

### **Step 3: Verify**

After running, you should see:
```
✅ RLS enabled on 5 tables
✅ 20+ policies created
✅ Verification queries show results
```

---

## 🔍 What RLS Does:

### **Before RLS:**
```
User A logs in → Sees ALL properties (A, B, C)
User B logs in → Sees ALL properties (A, B, C)
❌ Privacy Problem!
```

### **After RLS:**
```
User A logs in → Sees ONLY User A's properties ✅
User B logs in → Sees ONLY User B's properties ✅
🔒 Secure!
```

---

## 📋 Policies Created:

### **Properties:**
- ✅ Users can view their own properties
- ✅ Users can create properties (auto-assigned to them)
- ✅ Users can update their own properties
- ✅ Users can delete their own properties

### **Tenants:**
- ✅ Users can view their own tenants
- ✅ Users can create tenants
- ✅ Users can update their own tenants
- ✅ Users can delete their own tenants

### **Contracts:**
- ✅ Users can view their own contracts
- ✅ Users can create contracts
- ✅ Users can update their own contracts
- ✅ Users can delete their own contracts

### **Messages:**
- ✅ Users can view messages for their properties
- ✅ Users can send messages
- ✅ Users can update/delete their messages

### **Interested Tenants:**
- ✅ Users can view interested tenants for their properties
- ✅ Users can manage interested tenants

---

## 🧪 How to Test:

### **1. Create two test accounts:**

Account 1:
```
Email: user1@test.com
Password: password123
```

Account 2:
```
Email: user2@test.com
Password: password123
```

### **2. Add properties as User 1:**
- Login as `user1@test.com`
- Dashboard should show test properties

### **3. Check isolation:**
- Logout
- Login as `user2@test.com`
- Dashboard should be EMPTY (no properties from User 1)
- ✅ RLS is working!

### **4. Add data to User 2:**
- Create a property as User 2
- Logout, login as User 1
- User 1 should NOT see User 2's property
- ✅ Perfect isolation!

---

## 🎯 Current Status:

### **Your Current User:**
- Check: https://supabase.com/dashboard/project/aifbyfmzrlthmqlepxhk/auth/users
- Your test properties are assigned to: `00000000-0000-0000-0000-000000000001` (dummy user)

### **After enabling RLS:**
- You'll need to update the `user_id` in seed data OR create new properties through the UI
- New properties created via UI will automatically use your logged-in user ID

---

## 🔄 Update Seed Data (Optional):

If you want to see the seed data after RLS, you need to:

1. Get your User ID from Supabase Auth Users page
2. Update `seed.sql` file:
```sql
-- Replace this line:
'00000000-0000-0000-0000-000000000001'

-- With your actual user ID:
'YOUR-ACTUAL-USER-ID-HERE'
```
3. Re-run seed.sql

---

## ⚠️ Important Notes:

1. **After enabling RLS**, all existing data with dummy user IDs won't be visible
2. **Solution**: Either update seed data with real user IDs, or create new data through the UI
3. **API routes now check auth** - unauthenticated requests will get 401 Unauthorized

---

## 🐛 Troubleshooting:

### **Issue: "No properties found" after enabling RLS**
**Solution**: The seed data has dummy user_id. Either:
- Create new properties through the UI (they'll use your real user ID)
- OR update seed.sql with your user ID and re-run

### **Issue: "Unauthorized" error**
**Solution**: Make sure you're logged in. RLS + API now require authentication.

### **Issue: "Permission denied"**
**Solution**: Check that RLS policies were created successfully. Re-run the SQL if needed.

---

## 🎉 After RLS is Enabled:

Your LeaseAI app will be:
- ✅ **Secure** - Users can only see their own data
- ✅ **Private** - No data leaks between users
- ✅ **Production-ready** - Proper multi-tenant architecture
- ✅ **Scalable** - Ready for real users!

---

## 📝 Next Steps After RLS:

1. ✅ Enable RLS (you're doing this now)
2. 🔵 Setup Google OAuth (5 minutes)
3. 💳 Connect Stripe for payments
4. 🚀 Deploy to production!

---

**Ready? Go to Supabase SQL Editor and run the SQL!** 🚀
