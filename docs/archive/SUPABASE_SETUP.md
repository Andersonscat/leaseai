# Supabase Setup Guide for LeaseAI

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up / Log in
4. Click "New Project"
5. Fill in:
   - **Name**: LeaseAI
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free

### 2. Run Database Schema

1. Go to your project dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire content from `supabase/schema.sql`
5. Paste it into the editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

✅ This will create all tables, indexes, and security policies!

### 3. Get API Keys

1. Click **Settings** (gear icon in sidebar)
2. Click **API**
3. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGc...
```

### 4. Add to .env.local

Create/update `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Keep existing Clerk keys (we'll migrate later)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Keep existing Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 5. Test Connection

Restart your dev server:
```bash
npm run dev
```

---

## 📊 Database Tables Created

### **properties** - Real estate listings
- Property details (address, price, beds, baths)
- Images, amenities, features
- Type: rent or sale
- Status tracking

### **tenants** - Tenant information
- Contact details
- Lease information
- Payment status
- Property association

### **contracts** - Lease agreements
- Full contract text
- Status tracking
- Associated property and tenant

### **messages** - Chat system
- Landlord ↔ Tenant communication
- Read/unread status
- Timestamps

### **interested_tenants** - Property inquiries
- Track who's interested in which property
- Message counts
- Last message preview

---

## 🔒 Security (Row Level Security)

All tables have RLS enabled:
- Users can only see/edit **their own data**
- Based on `auth.uid()` (Supabase Auth user ID)
- Automatic data isolation per user

---

## 🎯 Next Steps

After setup:

1. **Test data insertion** - Add sample property
2. **Connect to frontend** - Replace mock data
3. **Enable Storage** - For property images
4. **Setup Supabase Auth** - Replace Clerk (optional)

---

## 🆘 Troubleshooting

### "relation does not exist"
- Make sure you ran the full schema.sql
- Check SQL Editor for errors

### "row-level security policy violation"
- Make sure you're logged in via Supabase Auth
- Check that `user_id` matches `auth.uid()`

### Can't connect
- Verify URL and keys in .env.local
- Restart dev server
- Check Supabase project is active

---

## 📚 Useful Supabase Features

- **Table Editor** - View/edit data visually
- **Database** - See schema, relationships
- **SQL Editor** - Run queries
- **Storage** - Upload property images
- **Logs** - Debug API calls
- **API Docs** - Auto-generated REST/GraphQL docs

---

## 💡 Pro Tips

1. **Use Table Editor** during development to add test data
2. **Enable Realtime** for messages (auto-sync)
3. **Use Storage** for property images (CDN included)
4. **Check Logs** if something doesn't work

---

Ready to connect! 🎉
