# Stock SaaS — Architecture Plan

## Overview

A stock portfolio tracking SaaS built with Next.js 14 (App Router), Supabase for auth/database, and Yahoo Finance for market data. Three-tier subscription model with real-time watchlists and price alerts.

---

## Folder Structure

```
stock-saas/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   └── dashboard/page.tsx
│   │   ├── api/
│   │   │   ├── stocks/[symbol]/route.ts
│   │   │   ├── watchlist/route.ts
│   │   │   ├── subscription/route.ts
│   │   │   └── alerts/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              (Button, Input, Card, Modal, Badge, etc.)
│   │   ├── charts/          (StockChart, MiniSparkline, VolumeBar)
│   │   ├── watchlist/       (WatchlistTable, WatchlistItem, AddStockForm)
│   │   ├── alerts/          (AlertList, AlertForm, AlertBadge)
│   │   └── layout/          (Navbar, Sidebar, Footer)
│   ├── lib/
│   │   ├── supabase.ts      (client + server helpers)
│   │   └── yahoo-finance.ts (quote + history fetchers)
│   ├── store/
│   │   └── index.ts         (Zustand global store)
│   └── types/
│       └── index.ts         (shared TypeScript types)
├── .env.local
├── PLAN.md
└── package.json
```

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (mirrors Supabase auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  tier          TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  tier                   TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlists
CREATE TABLE public.watchlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'My Watchlist',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlist Items
CREATE TABLE public.watchlist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT,
  UNIQUE(watchlist_id, symbol)
);

-- Alerts
CREATE TABLE public.alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  condition    TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  target_price NUMERIC(12,4) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_watchlist_items_user   ON public.watchlist_items(user_id);
CREATE INDEX idx_watchlist_items_symbol ON public.watchlist_items(symbol);
CREATE INDEX idx_alerts_user_active     ON public.alerts(user_id, is_active);
CREATE INDEX idx_alerts_symbol          ON public.alerts(symbol);
```

---

## Subscription Tiers

| Feature                | Free     | Pro ($29/mo) | Enterprise ($99/mo) |
|------------------------|----------|--------------|---------------------|
| Watchlist stocks       | 5 max    | Unlimited    | Unlimited           |
| Price alerts           | No       | Yes          | Yes                 |
| Historical charts      | 1 month  | 1 year       | 5 years             |
| Multiple watchlists    | 1        | 10           | Unlimited           |
| API access             | No       | No           | Yes                 |
| Export CSV             | No       | Yes          | Yes                 |
| Real-time quotes       | Delayed  | Real-time    | Real-time           |
| Priority support       | No       | No           | Yes                 |

---

## API Routes

### GET /api/stocks/[symbol]
- Fetches quote + chart data from Yahoo Finance
- Query params: `range` (1d, 1mo, 3mo, 1y, 5y), `interval`
- Auth: required (session)
- Rate limit: based on tier
- Returns: `{ quote: QuoteData, history: ChartPoint[] }`

### GET /api/watchlist
- Returns all watchlists + items for authenticated user
- Auth: required
- Returns: `{ watchlists: Watchlist[] }`

### POST /api/watchlist
- Add stock to watchlist
- Body: `{ symbol: string, watchlistId?: string }`
- Validates tier limits (Free: max 5 stocks)
- Returns: `{ item: WatchlistItem }`

### DELETE /api/watchlist
- Remove stock from watchlist
- Body: `{ itemId: string }`
- Returns: `{ success: true }`

### GET /api/subscription
- Returns current user subscription + tier
- Auth: required
- Returns: `{ subscription: Subscription, tier: string }`

### POST /api/subscription
- Create/update subscription (Stripe webhook handler stub)
- Body: Stripe event payload
- Returns: `{ received: true }`

### GET /api/alerts
- Returns all alerts for authenticated user
- Auth: required (Pro/Enterprise only)
- Returns: `{ alerts: Alert[] }`

### POST /api/alerts
- Create a new price alert
- Body: `{ symbol: string, condition: 'above'|'below', targetPrice: number }`
- Requires Pro or Enterprise tier
- Returns: `{ alert: Alert }`

### DELETE /api/alerts
- Delete or deactivate an alert
- Body: `{ alertId: string }`
- Returns: `{ success: true }`

---

## Component Hierarchy

```
app/layout.tsx
└── RootLayout
    ├── (auth)/login/page.tsx
    │   └── LoginForm (react-hook-form + zod)
    ├── (auth)/register/page.tsx
    │   └── RegisterForm
    └── (dashboard)/dashboard/page.tsx
        ├── DashboardLayout
        │   ├── Navbar
        │   │   ├── UserMenu
        │   │   └── TierBadge
        │   └── Sidebar
        │       └── WatchlistNav
        └── DashboardContent
            ├── WatchlistTable
            │   ├── WatchlistItem (per row)
            │   │   ├── MiniSparkline
            │   │   └── PriceChange
            │   └── AddStockForm
            ├── StockDetail (modal/panel)
            │   ├── StockChart (recharts)
            │   ├── QuoteStats
            │   └── AlertForm (Pro+ only)
            └── AlertList (Pro+ only)
                └── AlertItem
```

---

## Supabase RLS Policies Plan

```sql
-- profiles: users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- subscriptions: users can only view their own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- watchlists: full CRUD for own watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own watchlists" ON public.watchlists
  FOR ALL USING (auth.uid() = user_id);

-- watchlist_items: full CRUD for own items
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own watchlist items" ON public.watchlist_items
  FOR ALL USING (auth.uid() = user_id);

-- alerts: full CRUD for own alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);
```

---

## Environment Variables

```bash
# .env.local — never commit real values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (for subscription billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Tech Stack Summary

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Framework   | Next.js 14 (App Router, TypeScript)    |
| Styling     | Tailwind CSS + clsx + tailwind-merge   |
| Auth        | Supabase Auth (email/password + OAuth) |
| Database    | Supabase (PostgreSQL + RLS)            |
| State       | Zustand                                |
| Forms       | react-hook-form + zod                  |
| Charts      | Recharts                               |
| Animations  | Framer Motion                          |
| Market Data | yahoo-finance2                         |
| Icons       | Lucide React                           |
| Date utils  | date-fns                               |
| Billing     | Stripe (future integration)            |
| Deployment  | Vercel                                 |
