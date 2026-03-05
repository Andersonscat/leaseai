# LeaseAI — Feature Overview

A comprehensive list of all features built into the LeaseAI platform, organized by category.

---

## 1. Authentication & Onboarding

- Email/password authentication via Supabase Auth
- Social OAuth login — Google, GitHub, Facebook, Apple
- Route protection via middleware (public vs. protected routes)
- 3-step onboarding wizard — Profile setup, Connect Gmail, Add first property (Zillow import)
- Setup checklist banner — Guides new users to complete key actions

---

## 2. Gmail Integration

- Gmail OAuth flow — Per-user token storage in `oauth_tokens` table
- Gmail disconnect — Remove tokens and unlink account
- Gmail connection status — Check if Gmail is linked and configured
- Manual Gmail sync — On-demand inbox sync
- Gmail Pub/Sub watch — Register for real-time push notifications on new emails
- Gmail webhook handler — Receives Google Pub/Sub pushes, triggers automatic sync
- Email sending — Send replies directly from the app via Gmail API
- ngrok webhook tunnel (dev) — Local development script for Pub/Sub testing

---

## 3. AI / Gemini Intelligence

- AI email parsing — Extract lead info (name, email, phone, intent, urgency, budget) using Gemini 2.5 Flash
- AI email filtering — Classify emails as real inquiries vs. spam/newsletters/thank-you notes
- AI auto-reply — Language-aware, realtor-style automatic responses to leads
- AI conversation analysis — Analyze full conversation threads for insights
- AI lead qualification — 8 core qualification fields, smart question bundling, AI disclosure compliance
- AI property extraction — Extract property parameters from free-text descriptions
- AI thinking UI — Animated reasoning steps, thinking messages, and activity timeline components
- AI sandbox / chat — Interactive sandbox for testing the AI agent
- Rate limiting — In-memory rate limiter for Gemini API calls
- Retry logic — Automatic retry on 429 (rate limit) responses

---

## 4. Inbox & Conversations

- Conversations inbox — 3-pane layout: leads list, chat thread, AI activity panel
- Source filtering — Filter leads by source (All, Urgent, Hot, Tours)
- Lead source detection — Automatic identification of Zillow, Airbnb, and other platforms
- Message threading — Full conversation history per tenant
- Send replies — Compose and send messages from the inbox
- AI auto-reply trigger — One-click AI-generated response
- Conversation delete — Soft delete conversations
- Unread badge — Real-time unread count with browser event system

---

## 5. Properties Management

- Property CRUD — Create, read, update, delete properties
- Zillow / Realtor / Redfin import — Import property details from listing URLs
- Property parameters — Detailed specs (beds, baths, price, amenities, parking, pet policy, etc.)
- Granular address fields — City, state, zip code breakdown
- Property images — Upload and store images in Supabase Storage, image proxy endpoint
- Amenities catalog — Canonical amenity keys with normalized text
- AI-assisted flag — Track whether a property was created with AI help
- Soft delete — Properties can be soft-deleted

---

## 6. Tenants & Pipeline

- Tenant CRUD — Create, read, update, delete tenants/leads
- Pipeline board — Kanban-style drag-and-drop with stages: New Lead → Qualified → Viewing Scheduled → Application → Lease Signed
- Active leads table — Tabular view with avatars, stages, and selection
- Tenant detail page — Full profile with messages and history
- AI tenant insights — AI-generated summary, budget range, move-in date, preferences

---

## 7. Calendar & Appointments

- Google Calendar integration — OAuth-based calendar access
- Free/busy lookup — Check availability before scheduling
- Create calendar events — Book viewings/showings directly
- Appointments list — View today's appointments with tenant and property info
- Calendar events API — Fetch and display calendar events in the dashboard

---

## 8. Contracts

- Contract CRUD — Create and manage lease contracts
- Rich text editor — Contract content editing
- Contract detail page — View/edit individual contracts
- Property & tenant linking — Contracts tied to specific properties and tenants

---

## 9. Payments & Billing

- Stripe Checkout — Subscription payment flow
- Pricing plans — Free Trial and Growth plan ($29/mo)
- Billing page — Plan selection and Stripe redirect
- Usage limits — Plan-based limits on email parsing, AI calls, properties, and contracts (v1 and v2)

---

## 10. User Profile

- Avatar upload — Upload profile picture to Supabase Storage
- Avatar component — Displays image or colored initials fallback
- User menu — Sidebar user info and navigation

---

## 11. Dashboard & Navigation

- Tabbed dashboard — Inbox, Properties, Tenants/Pipeline, Calendar, Contracts, Management, Promote, Analytics
- Sidebar navigation — Persistent sidebar with links and unread badge
- AI chat side panel — Resizable AI assistant panel in the dashboard
- Design preview — Static mockup/preview page

---

## 12. Landing Page & Marketing

- Hero section — Technical hero with grid background and dashboard mockup
- 3D hero — Mouse-based 3D rotation with gradient blobs
- Feature sections — Bento-style spotlight cards (portfolio, integrations, super app)
- Interactive workflow — 3-step visualization (Lead Capture → Qualification → Auto-Booking)
- Super app section — Mobile-style cards for Properties, Leasing, Inbox, Search
- FAQ section — Accordion-style frequently asked questions
- Testimonials — Customer quotes
- Logo marquee — Infinite scrolling partner/platform logos
- Typewriter effect — Animated word cycling in hero
- Scroll reveal — IntersectionObserver-based fade/slide animations
- Navbar — Fixed top navigation with login/signup links

---

## 13. Database & Schema

- Core tables — `properties`, `tenants`, `contracts`, `messages`, `interested_tenants`, `oauth_tokens`
- Row Level Security (RLS) — Enabled on all tables
- 12 migrations — Pipeline stages, property parameters, granular addresses, Zillow fields, AI thoughts, tenant insights, amenities normalization, legal compliance, storage buckets, OAuth tokens
- Legal compliance — AI audit log, do-not-contact flag, `anonymize_tenant_pii()` function
- Auto-updated timestamps — `update_updated_at_column()` trigger

---

## 14. Developer & Debug Tools

- Debug endpoints — `/api/debug-agent`, `/api/debug-messages`, `/api/debug/sandbox`
- Test endpoints — `/api/test-calendar`
- Utility scripts — Gmail token refresh, trigger sync, list calendar events, check schema, test Gemini, run migrations
- Agent evaluation script — `eval-agent.ts` for testing AI agent behavior

---

## 15. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript, React 18 |
| Styling | Tailwind CSS, Framer Motion |
| Icons | Lucide React |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (avatars, property images) |
| AI | Google Gemini 2.5 Flash |
| Email | Gmail API + Google Pub/Sub |
| Calendar | Google Calendar API |
| Payments | Stripe |
| Dev Tools | ngrok (webhook tunnel) |
