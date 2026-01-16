# LeaseAI - AI Operating System for Real Estate

AI-powered SaaS platform for real estate professionals.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Auth (get from clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe (get from stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

### 3. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Name it "LeaseAI"
3. Copy your API keys to `.env.local`
4. In Clerk dashboard, configure:
   - Sign-in methods: Email, Google (optional)
   - Paths: `/sign-in`, `/sign-up`
   - After sign-in redirect: `/dashboard`

### 4. Set Up Stripe Payments

1. Go to [stripe.com](https://stripe.com) and create an account
2. In Stripe Dashboard:
   - Go to Products → Create Product
   - Name: "Starter Plan"
   - Price: $29/month recurring
   - Copy the Price ID (starts with `price_`)
3. Copy your API keys to `.env.local`
4. Enable Test Mode for development

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Import your GitHub repository
5. Add Environment Variables (all keys from `.env.local`)
6. Click "Deploy"

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Follow prompts and add environment variables when asked.

## 🧪 Testing Stripe Checkout

Use these test card numbers in Stripe Test Mode:
- Success: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## 📋 Features

### ✅ Implemented (MVP)
- Landing page with hero and features
- Clerk authentication (sign-up/sign-in)
- Protected dashboard with mock data
- Stripe Checkout integration
- Responsive design
- Billing page with pricing

### 🚧 Coming Next (Post-MVP)
- Email inbox integration
- AI agent with auto-responses
- Lead qualification system
- Calendar integration (Calendly)
- Analytics dashboard with real data
- Database integration (PostgreSQL/Supabase)
- Webhook handlers for Stripe
- Customer portal for subscription management

## 🏗️ Project Structure

```
leaseai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout with Clerk
│   ├── globals.css           # Global styles
│   ├── sign-in/              # Sign-in page
│   ├── sign-up/              # Sign-up page
│   ├── dashboard/            # Dashboard (protected)
│   ├── billing/              # Billing page (protected)
│   └── api/
│       └── checkout/         # Stripe Checkout API
├── components/
│   └── ui/                   # shadcn components
├── lib/
│   └── utils.ts             # Utilities
├── middleware.ts            # Clerk auth middleware
└── package.json
```

## 🎯 Success Criteria

- ✅ User can sign up
- ✅ User can sign in
- ✅ Dashboard loads with mock data
- ✅ Billing page shows pricing
- ✅ Stripe Checkout redirects correctly
- ✅ Responsive on mobile/desktop
- ✅ Deployed on Vercel

## 💡 Tips

1. **Clerk Development**: Use development instance keys, not production
2. **Stripe Testing**: Always use test mode keys during development
3. **Environment Variables**: Never commit `.env.local` to git
4. **Vercel Deployment**: Set all environment variables in Vercel dashboard

## 🆘 Troubleshooting

**Clerk not working?**
- Check environment variables are set correctly
- Verify middleware.ts is protecting routes
- Check Clerk dashboard for correct redirect URLs

**Stripe checkout failing?**
- Ensure you're in Test Mode
- Verify STRIPE_PRICE_ID is correct
- Check API keys are not expired

**Build failing on Vercel?**
- Ensure all environment variables are set
- Check TypeScript errors locally first
- Review build logs in Vercel dashboard

## 📞 Support

For issues or questions, check:
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

MIT
