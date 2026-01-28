# ⚡ LeaseAI Quick Start

## 🎯 What You Got

A complete Next.js 14 SaaS MVP with:
- ✅ Landing page with hero & features
- ✅ Authentication (Clerk - sign up/login)
- ✅ Protected dashboard
- ✅ Billing page with $29/month plan
- ✅ Stripe Checkout integration
- ✅ Responsive design
- ✅ Ready to deploy to Vercel

## 🚀 Deploy in 15 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd leaseai
npm install
```

### Step 2: Get API Keys (5 min)

**Clerk** (clerk.com):
- Create app "LeaseAI"
- Copy: pk_test_... and sk_test_...

**Stripe** (stripe.com):
- Enable Test Mode
- Create Product: "Starter Plan" $29/month
- Copy: pk_test_..., sk_test_..., and price_...

### Step 3: Setup Environment (2 min)
Create `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

### Step 4: Test Locally (2 min)
```bash
npm run dev
```
Open http://localhost:3000

### Step 5: Deploy to Vercel (5 min)
```bash
git init
git add .
git commit -m "Initial commit"
# Create GitHub repo, then:
git remote add origin YOUR_REPO_URL
git push -u origin main
```

Go to vercel.com:
1. Import GitHub repo
2. Add all environment variables
3. Deploy
4. Done! 🎉

## 📱 Test Flow

1. Open your Vercel URL
2. Click "Get Started"
3. Sign up with email
4. See dashboard with mock data
5. Click "Billing"
6. Click "Upgrade Now"
7. Use test card: 4242 4242 4242 4242
8. Complete payment
9. Return to dashboard

## 📂 Project Structure

```
leaseai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Main dashboard (protected)
│   ├── billing/page.tsx      # Pricing & Stripe (protected)
│   ├── sign-in/              # Auth pages (Clerk)
│   ├── sign-up/
│   └── api/checkout/         # Stripe API route
├── components/ui/            # Reusable components
├── middleware.ts            # Route protection
└── .env.local.example       # Config template
```

## 🎨 Pages

- **/** - Landing page (public)
- **/sign-in** - Login (Clerk)
- **/sign-up** - Register (Clerk)
- **/dashboard** - Main workspace (protected)
- **/billing** - Plans & payment (protected)

## 🔐 Environment Variables

Required for deployment:
- 6 Clerk keys (authentication)
- 3 Stripe keys (payments)

Get from:
- clerk.com → Your App → API Keys
- stripe.com → Developers → API Keys

## 🐛 Troubleshooting

**Can't log in?**
→ Check Clerk keys, add Vercel domain to Clerk Dashboard → Domains

**Stripe checkout fails?**
→ Verify STRIPE_PRICE_ID, use Test Mode, use test card 4242...

**Build errors?**
→ Run `npm run build` locally, check environment variables

## 📚 Documentation

- **README.md** - Complete overview
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment
- **PROJECT_STRUCTURE.md** - Technical architecture
- **LAUNCH_CHECKLIST.md** - Pre-launch tasks

## 🎉 You're Ready!

Your MVP is production-ready. Next steps:
1. Deploy to Vercel (15 min)
2. Test with real users
3. Gather feedback
4. Add features:
   - Email integration
   - AI agent
   - Calendar sync
   - Analytics

## 🆘 Need Help?

Check:
- Clerk docs: clerk.com/docs
- Stripe docs: stripe.com/docs
- Next.js docs: nextjs.org/docs

---

**Time from code to live SaaS: 15 minutes** ⚡

Good luck with your launch! 🚀
