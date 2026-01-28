# 🚀 LeaseAI Launch Checklist

## Pre-Launch Setup (15 минут)

### ☐ 1. Clerk Setup (3 минуты)
- [ ] Create Clerk account at clerk.com
- [ ] Create new application "LeaseAI"
- [ ] Copy Publishable Key (pk_test_...)
- [ ] Copy Secret Key (sk_test_...)
- [ ] Configure paths: /sign-in, /sign-up, /dashboard
- [ ] Save keys for deployment

### ☐ 2. Stripe Setup (4 минуты)
- [ ] Create Stripe account at stripe.com
- [ ] Enable Test Mode
- [ ] Create Product "Starter Plan"
- [ ] Set price: $29/month recurring
- [ ] Copy Price ID (price_...)
- [ ] Copy Publishable Key (pk_test_...)
- [ ] Copy Secret Key (sk_test_...)
- [ ] Save keys for deployment

### ☐ 3. GitHub Setup (2 минуты)
- [ ] Create new GitHub repository
- [ ] Name: leaseai
- [ ] Initialize with: Nothing (empty repo)
- [ ] Copy repository URL
- [ ] Push code:
  ```bash
  git init
  git add .
  git commit -m "Initial MVP"
  git branch -M main
  git remote add origin YOUR_REPO_URL
  git push -u origin main
  ```

### ☐ 4. Vercel Deployment (6 минуты)
- [ ] Sign up/login at vercel.com with GitHub
- [ ] Import leaseai repository
- [ ] Configure project (Next.js auto-detected)
- [ ] Add all environment variables:
  - [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - [ ] CLERK_SECRET_KEY
  - [ ] NEXT_PUBLIC_CLERK_SIGN_IN_URL
  - [ ] NEXT_PUBLIC_CLERK_SIGN_UP_URL
  - [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
  - [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_PRICE_ID
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 min)
- [ ] Copy Vercel URL (e.g., leaseai.vercel.app)

### ☐ 5. Clerk Domain Configuration (1 минута)
- [ ] Return to Clerk Dashboard
- [ ] Navigate to Settings → Domains
- [ ] Add Vercel URL to Allowed origins
- [ ] Save changes

---

## Testing Checklist (10 минут)

### ☐ Landing Page
- [ ] Visit your Vercel URL
- [ ] Hero section displays correctly
- [ ] "Start Free Trial" button works
- [ ] "Sign In" button works
- [ ] All 3 feature cards visible
- [ ] Footer displays
- [ ] Mobile responsive (test on phone)

### ☐ Authentication
- [ ] Click "Get Started"
- [ ] Sign-up form loads
- [ ] Create test account:
  - Email: test@example.com
  - Password: TestPass123!
- [ ] Verify email (if required)
- [ ] Redirects to /dashboard
- [ ] Dashboard loads successfully

### ☐ Dashboard
- [ ] "LeaseAI" logo visible
- [ ] UserButton (profile) in top-right
- [ ] Sidebar navigation present:
  - Inbox
  - Analytics
  - Billing
- [ ] 3 stat cards display:
  - Inbox: 0
  - Conversion: —%
  - Properties: 0
- [ ] "Getting Started" section visible
- [ ] "Upgrade Plan" button present

### ☐ Billing Page
- [ ] Click "Billing" in sidebar
- [ ] Billing page loads
- [ ] Two pricing cards visible:
  - Free Trial ($0/14 days)
  - Starter Plan ($29/month)
- [ ] "Most Popular" badge on Starter
- [ ] Feature lists display
- [ ] FAQ section visible
- [ ] Click "Upgrade Now" button

### ☐ Stripe Checkout
- [ ] Redirects to Stripe Checkout
- [ ] Starter Plan details correct
- [ ] Enter test card:
  - Card: 4242 4242 4242 4242
  - Expiry: 12/34
  - CVC: 123
  - ZIP: 12345
  - Name: Test User
- [ ] Complete payment
- [ ] Redirects to /dashboard?success=true
- [ ] Dashboard loads

### ☐ Sign Out
- [ ] Click UserButton (top-right)
- [ ] Click "Sign out"
- [ ] Redirects to landing page
- [ ] Try accessing /dashboard (should redirect to sign-in)

---

## Production Readiness (Optional)

### ☐ Custom Domain (If Applicable)
- [ ] Purchase domain (e.g., leaseai.com)
- [ ] Add domain in Vercel
- [ ] Configure DNS settings
- [ ] Wait for SSL certificate
- [ ] Update Clerk allowed origins
- [ ] Test with new domain

### ☐ Switch to Production Mode
- [ ] Stripe Dashboard → Disable Test Mode
- [ ] Create production product ($29/month)
- [ ] Get production API keys
- [ ] Update Vercel environment variables:
  - [ ] STRIPE_SECRET_KEY (live key)
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (live key)
  - [ ] STRIPE_PRICE_ID (production price)
- [ ] Clerk → Switch to production instance
- [ ] Update Clerk keys in Vercel
- [ ] Test real payment (refund after)

---

## Marketing & Launch

### ☐ Pre-Launch
- [ ] Create social media posts
- [ ] Prepare email announcement
- [ ] Set up analytics (Google Analytics)
- [ ] Create demo video/screenshots
- [ ] Write blog post about features

### ☐ Launch Day
- [ ] Post on Twitter/LinkedIn
- [ ] Share in real estate communities
- [ ] Email your network
- [ ] Submit to Product Hunt
- [ ] Post in local Bellevue groups

### ☐ Post-Launch Monitoring
- [ ] Monitor Vercel analytics
- [ ] Check Clerk dashboard for signups
- [ ] Watch Stripe dashboard for payments
- [ ] Respond to user feedback
- [ ] Fix critical bugs quickly

---

## Support Setup

### ☐ Customer Support
- [ ] Set up support email (support@leaseai.com)
- [ ] Create help center/FAQ
- [ ] Add Intercom or similar (optional)
- [ ] Document common issues

### ☐ Monitoring & Alerts
- [ ] Set up Sentry for error tracking
- [ ] Configure Vercel alerts
- [ ] Monitor Stripe failed payments
- [ ] Track user activity

---

## Success Metrics

Track these KPIs:

### Week 1 Goals
- [ ] 10+ signups
- [ ] 3+ paid subscriptions
- [ ] <5% error rate
- [ ] <3s page load time

### Month 1 Goals
- [ ] 50+ signups
- [ ] 15+ paid subscriptions
- [ ] 30% conversion rate (free → paid)
- [ ] $435+ MRR (15 × $29)

---

## Troubleshooting Common Issues

### Build Failed on Vercel
**Problem**: Build errors during deployment
**Solution**:
1. Check environment variables are set
2. Run `npm run build` locally first
3. Review Vercel build logs
4. Ensure all dependencies installed

### Clerk Login Not Working
**Problem**: Can't sign in/sign up
**Solution**:
1. Verify Clerk keys in Vercel env vars
2. Check Clerk dashboard → Domains
3. Add Vercel URL to allowed origins
4. Clear browser cookies, try incognito

### Stripe Checkout 404
**Problem**: /api/checkout returns 404
**Solution**:
1. Verify STRIPE_PRICE_ID is correct
2. Check Stripe is in Test Mode
3. Ensure STRIPE_SECRET_KEY is valid
4. Review API route logs in Vercel

### Can't Access Dashboard
**Problem**: Dashboard redirects to sign-in
**Solution**:
1. Check middleware.ts is deployed
2. Verify Clerk session is active
3. Try logging out and back in
4. Check browser console for errors

### Payment Not Processing
**Problem**: Stripe checkout fails
**Solution**:
1. Verify using test card numbers
2. Check Stripe Dashboard logs
3. Ensure webhook configured (future)
4. Verify price ID matches product

---

## Emergency Contacts

- **Vercel Support**: vercel.com/support
- **Clerk Support**: clerk.com/support
- **Stripe Support**: support.stripe.com
- **Next.js Docs**: nextjs.org/docs

---

## 🎉 Launch Complete!

Once all checkboxes are complete, your LeaseAI MVP is:
- ✅ Deployed to production
- ✅ Accepting real signups
- ✅ Processing payments
- ✅ Ready for first customers

**Next**: Start marketing and gather user feedback!

---

**Expected Timeline**:
- Setup: 15 minutes
- Testing: 10 minutes
- Production switch: 15 minutes
- **Total: 40 minutes from code to live SaaS** 🚀
