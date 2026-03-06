# LeaseAI — MVP

## What is LeaseAI?

LeaseAI is an AI-powered assistant for landlords that automatically captures leads from Gmail, qualifies them, and replies — so you never miss a rental inquiry again.

---

## Core Features

### 1. Smart Inbox

Connect your Gmail and LeaseAI automatically:

- Syncs your inbox in real-time (Gmail Pub/Sub push notifications)
- Detects rental inquiries from Zillow, Airbnb, Apartments.com, and direct emails
- Filters out spam, newsletters, and non-lead emails using AI
- Extracts lead info: name, email, phone, intent, urgency, budget
- Groups all messages into per-lead conversation threads

### 2. AI Auto-Reply

When a new lead comes in, LeaseAI:

- Analyzes the inquiry (what property, what they want, how urgent)
- Drafts a professional, language-aware reply matching the lead's language
- Sends it from your Gmail — the lead sees your real email, not a bot

### 3. Lead Pipeline

Track every lead from first contact to signed lease:

- **Kanban board** with drag-and-drop stages: New Lead → Qualified → Viewing Scheduled → Application → Lease Signed
- **Lead table** view with filters and search
- **Lead detail page** with full conversation history, AI-generated insights (budget, move-in date, preferences)

### 4. AI Lead Qualification

LeaseAI qualifies leads by gathering 8 key data points through natural conversation:

- Move-in date, budget, employment, number of occupants
- Pet situation, lease term preference, viewing availability
- Responds in the lead's language with proper AI disclosure

### 5. Property Management

- Add properties manually or import from Zillow, Realtor.com, or Redfin by URL
- AI extracts property details from listing pages automatically
- Full property specs: price, beds, baths, sqft, amenities, parking, pet policy
- Property image upload and gallery

### 6. Calendar & Showings

- Connect Google Calendar
- Check your availability (free/busy) before scheduling
- Book viewings directly — creates calendar events
- View today's appointments from the dashboard

### 7. Contracts

- Create lease contracts linked to specific properties and tenants
- Rich text editor for contract content
- Track contract status

---

## User Flows

### Flow 1: First-Time Setup

```mermaid
flowchart TD
    A[Sign Up] -->|email or Google| B[Set Up Profile]
    B --> C[Connect Gmail]
    C -->|OAuth| D[Add First Property]
    D -->|Manual or Zillow URL| E[Dashboard]
    E --> F[Setup Checklist]

    style A fill:#6366f1,color:#fff,stroke:none
    style E fill:#10b981,color:#fff,stroke:none
```

### Flow 2: New Lead Arrives (Automated)

```mermaid
flowchart TD
    A[Lead emails you] -->|Zillow / Airbnb / Direct| B[Gmail Pub/Sub Push]
    B --> C[LeaseAI Syncs Email]
    C --> D{AI Filter: Real Inquiry?}
    D -->|No| E[Ignored]
    D -->|Yes| F[AI Parses Lead Info]
    F -->|name, phone, intent, urgency| G[Create Tenant + Thread]
    G --> H[AI Generates Reply]
    H -->|in lead's language| I[Send from Your Gmail]
    I --> J[Lead in Inbox + AI Log]

    style A fill:#6366f1,color:#fff,stroke:none
    style E fill:#ef4444,color:#fff,stroke:none
    style J fill:#10b981,color:#fff,stroke:none
    style D fill:#f59e0b,color:#000,stroke:none
```

### Flow 3: Working the Inbox

```mermaid
flowchart TD
    A[Open Inbox] --> B[Browse Leads]
    B -->|sorted by recency, source icons| C[Select a Lead]
    C --> D[View Conversation Thread]
    D --> E{Choose Action}
    E --> F[Reply Manually]
    E --> G[AI Auto-Reply]
    E --> H[View AI Timeline]
    E --> I[Analyze Conversation]

    style A fill:#6366f1,color:#fff,stroke:none
    style G fill:#10b981,color:#fff,stroke:none
    style F fill:#3b82f6,color:#fff,stroke:none
    style H fill:#8b5cf6,color:#fff,stroke:none
    style I fill:#8b5cf6,color:#fff,stroke:none
```

### Flow 4: Lead Pipeline

```mermaid
flowchart LR
    A[New Lead] --> B[Qualified]
    B --> C[Viewing Scheduled]
    C --> D[Application]
    D --> E[Lease Signed]

    style A fill:#6366f1,color:#fff,stroke:none
    style B fill:#f59e0b,color:#000,stroke:none
    style C fill:#3b82f6,color:#fff,stroke:none
    style D fill:#8b5cf6,color:#fff,stroke:none
    style E fill:#10b981,color:#fff,stroke:none
```

```mermaid
flowchart TD
    A[Pipeline Board] --> B[Click Lead]
    B --> C[Lead Detail + AI Insights]
    C -->|budget, move-in, preferences| D[Schedule Viewing]
    D -->|Google Calendar| E[Move Through Stages]
    E --> F[Lease Signed]

    style A fill:#6366f1,color:#fff,stroke:none
    style F fill:#10b981,color:#fff,stroke:none
```

### Flow 5: Adding a Property

```mermaid
flowchart TD
    A[Add Property] --> B{Method}
    B -->|URL| C[Paste Zillow / Realtor / Redfin Link]
    C --> D[AI Extracts Details]
    D --> E[Review & Save]
    B -->|Manual| F[Fill in Details]
    F -->|address, price, beds, baths, amenities| G[Upload Photos]
    G --> E

    style A fill:#6366f1,color:#fff,stroke:none
    style E fill:#10b981,color:#fff,stroke:none
    style D fill:#f59e0b,color:#000,stroke:none
```

### System Architecture Overview

```mermaid
flowchart TB
    subgraph Sources["Lead Sources"]
        Z[Zillow]
        AB[Airbnb]
        DM[Direct Email]
    end

    subgraph Google["Google Services"]
        GM[Gmail API]
        PS[Pub/Sub]
        GC[Google Calendar]
    end

    subgraph LeaseAI["LeaseAI Core"]
        SYNC[Sync Engine]
        AI[Gemini AI]
        DB[(Supabase DB)]
        INBOX[Inbox UI]
        PIPE[Pipeline Board]
    end

    Z & AB & DM --> GM
    GM --> PS
    PS -->|webhook| SYNC
    SYNC --> AI
    AI -->|parse, filter, reply| DB
    DB --> INBOX
    DB --> PIPE
    INBOX -->|send reply| GM
    PIPE -->|schedule viewing| GC
    AI -->|qualify leads| DB

    style AI fill:#f59e0b,color:#000,stroke:none
    style DB fill:#6366f1,color:#fff,stroke:none
    style GM fill:#ef4444,color:#fff,stroke:none
    style GC fill:#3b82f6,color:#fff,stroke:none
```

---

## Tech Under the Hood

| Component | Technology |
|-----------|------------|
| App | Next.js 14, TypeScript, React 18 |
| UI | Tailwind CSS, Framer Motion |
| Auth | Supabase Auth (email + Google/GitHub OAuth) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Storage | Supabase Storage (property images, avatars) |
| AI | Google Gemini 2.5 Flash |
| Email | Gmail API + Google Pub/Sub (real-time) |
| Calendar | Google Calendar API |
| Payments | Stripe (subscription billing) |
