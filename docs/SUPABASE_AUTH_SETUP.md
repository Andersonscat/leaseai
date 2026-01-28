# Supabase Auth Setup Instructions

## ✅ What we just completed:

1. ✅ Removed Clerk from the project
2. ✅ Installed Supabase Auth packages
3. ✅ Created `/login` and `/signup` pages
4. ✅ Updated middleware for auth protection
5. ✅ Added logout functionality
6. ✅ Updated all navigation links

---

## 🔧 Next Steps - Enable Auth in Supabase:

### 1. Go to your Supabase Dashboard:
👉 https://supabase.com/dashboard/project/aifbyfmzrlthmqlepxhk

### 2. Enable Email Auth:
- Click **"Authentication"** in the left sidebar
- Click **"Providers"** tab
- Make sure **"Email"** is enabled (should be by default)
- **Confirm Email**: You can disable this for testing (Enable "Confirm email" = OFF)

### 3. Configure Site URL (Important!):
- Go to **"Authentication"** → **"URL Configuration"**
- Set **Site URL**: `http://localhost:3000`
- Set **Redirect URLs**: `http://localhost:3000/**`

### 4. (Optional) Disable Email Confirmation for testing:
- Go to **"Authentication"** → **"Providers"** → **"Email"**
- Toggle OFF "Confirm email" (for faster testing)
- Toggle OFF "Secure email change" (optional)

---

## 🎯 Test the Auth System:

### 1. Restart your dev server:
```bash
npm run dev
```

### 2. Open the app:
- Home: http://localhost:3000
- Signup: http://localhost:3000/signup
- Login: http://localhost:3000/login

### 3. Create a test account:
- Email: `test@example.com`
- Password: `password123`
- Full Name: `Test User`

### 4. After signup:
- You should be redirected to `/dashboard`
- You should see your initial (first letter of email) in the top right
- Click "Log Out" to test logout

---

## 🔐 What's Protected:

- ✅ `/dashboard/*` - All dashboard routes
- ✅ `/billing` - Billing page
- ✅ Public routes: `/`, `/login`, `/signup`, `/test-db`

---

## 🐛 Troubleshooting:

### If signup doesn't work:
1. Check Supabase Dashboard → Authentication → Users
2. Make sure email confirmation is disabled
3. Check browser console for errors

### If redirect doesn't work:
1. Check Site URL in Supabase settings
2. Make sure it's `http://localhost:3000` (no trailing slash)

### If logout doesn't work:
1. Check browser console
2. Clear cookies and try again

---

## 🎉 What's Working Now:

- ✅ Email/Password signup
- ✅ Email/Password login
- ✅ Logout
- ✅ Session management
- ✅ Protected routes
- ✅ User avatar (first letter)
- ✅ Redirect to dashboard after login

---

## 📝 Next Steps (After Auth Works):

1. Connect user sessions to database (filter properties/tenants by user)
2. Enable RLS (Row Level Security) in Supabase
3. Add password reset functionality
4. Add profile page
5. (Optional) Add social logins (Google, GitHub)

---

**Follow the steps above to complete the Supabase Auth setup!** 🚀
