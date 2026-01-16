# 🚀 LeaseAI Deployment Guide

## Step-by-Step Deployment to Vercel (10 минут)

### STEP 1: Clerk Setup (3 минуты)

1. Перейдите на [clerk.com](https://clerk.com)
2. Sign Up / Log In
3. Click "Add Application"
4. Name: **LeaseAI**
5. Select sign-in methods:
   - ✅ Email address
   - ✅ Google (optional)
6. Click "Create Application"

7. В Dashboard → API Keys:
   - Copy `Publishable key` (starts with `pk_test_`)
   - Copy `Secret key` (starts with `sk_test_`)
   - Save for later (Step 4)

8. Configure Paths (левое меню → Paths):
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

### STEP 2: Stripe Setup (4 минуты)

1. Перейдите на [stripe.com](https://stripe.com)
2. Sign Up / Log In
3. **Enable Test Mode** (toggle в правом верхнем углу)

4. Create Product:
   - Left menu → Products → "Add Product"
   - Name: **Starter Plan**
   - Description: AI Operating System for Real Estate
   - Pricing model: **Recurring**
   - Price: **$29.00 USD**
   - Billing period: **Monthly**
   - Click "Save product"

5. Copy Price ID:
   - In product details, find "API ID"
   - Copy value (starts with `price_`)
   - Save for later

6. Get API Keys:
   - Left menu → Developers → API keys
   - Copy `Publishable key` (starts with `pk_test_`)
   - Click "Reveal test key" for Secret key
   - Copy `Secret key` (starts with `sk_test_`)
   - Save for later

### STEP 3: Push to GitHub (2 минуты)

```bash
# В корне проекта leaseai/
git init
git add .
git commit -m "Initial LeaseAI MVP"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/leaseai.git
git push -u origin main
```

### STEP 4: Deploy to Vercel (3 минуты)

1. Перейдите на [vercel.com](https://vercel.com)
2. Sign Up with GitHub (если нет аккаунта)
3. Click "Add New..." → "Project"
4. Import вашего GitHub репозитория "leaseai"
5. Configure Project:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. **Environment Variables** (ВАЖНО!):

Click "Environment Variables", добавьте:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_... (from Clerk)
CLERK_SECRET_KEY = sk_test_... (from Clerk)
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_... (from Stripe)
STRIPE_SECRET_KEY = sk_test_... (from Stripe)
STRIPE_PRICE_ID = price_... (from Stripe Product)
```

7. Click "Deploy"

8. Wait 2-3 minutes for build ✨

### STEP 5: Configure Clerk Domains (1 минута)

После успешного деплоя:

1. Copy your Vercel URL (например: `https://leaseai.vercel.app`)
2. Вернитесь в Clerk Dashboard → Settings → Domains
3. Add your Vercel domain to **Allowed origins**
4. Save

### STEP 6: Test Everything ✅

1. Откройте ваш Vercel URL
2. Click "Get Started" → Sign Up
3. Create account (используйте реальный email)
4. Должны попасть на `/dashboard`
5. Click "Billing"
6. Click "Upgrade Now"
7. Используйте тестовую карту:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
8. Complete payment
9. Должны вернуться на dashboard с `?success=true`

## ✅ Success Checklist

- [ ] Clerk authentication works
- [ ] Can sign up new user
- [ ] Redirects to dashboard after sign-up
- [ ] Dashboard displays correctly
- [ ] Billing page loads
- [ ] Stripe Checkout redirects to payment page
- [ ] Test payment succeeds
- [ ] Redirects back to dashboard
- [ ] Mobile responsive

## 🔄 Update Deployment

Для обновления после изменений:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel автоматически пересоберёт проект.

## 🐛 Troubleshooting

### Build Failed
- Check all environment variables are set in Vercel
- Check for TypeScript errors: `npm run build` locally
- Review build logs in Vercel dashboard

### Clerk Login Not Working
- Verify environment variables in Vercel
- Check Clerk dashboard → Domains (add Vercel URL)
- Check middleware.ts exists and configured correctly

### Stripe Checkout 404
- Verify STRIPE_PRICE_ID is correct
- Check Stripe is in Test Mode
- Review API route logs in Vercel

### Can't Access Dashboard
- Clear browser cookies
- Try incognito mode
- Check middleware.ts protects correct routes

## 📊 Monitoring

После деплоя отслеживайте:

1. **Vercel Dashboard**: Build status, errors, analytics
2. **Clerk Dashboard**: User signups, sessions
3. **Stripe Dashboard**: Payments, subscriptions

## 🎉 Next Steps

После успешного деплоя:

1. Share Vercel URL с первыми пользователями
2. Соберите feedback
3. Добавьте реальные интеграции (email, calendar)
4. Настройте Stripe webhooks для subscription events
5. Добавьте базу данных (Supabase/PostgreSQL)

---

**Time to First Payment: < 15 minutes** 🚀
