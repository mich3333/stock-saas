# StockFlow

A stock market SaaS application with real-time quotes, watchlists, price alerts, and portfolio tracking.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, Tremor, Recharts
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe (subscriptions, webhooks)
- **Email**: Nodemailer (SMTP)
- **Data**: Yahoo Finance API (yahoo-finance2)
- **State**: Zustand
- **Deployment**: Vercel

## Tiers

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Watchlist stocks | 10 | Unlimited | Unlimited |
| Price alerts | - | Yes | Yes |
| Portfolio tracking | - | Yes | Yes |

## Local Setup

1. **Clone and install**

```bash
git clone <repo>
cd stock-saas
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` (see Environment Variables below).

3. **Set up Supabase** (see Supabase Setup below)

4. **Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | Stripe Price ID for Enterprise plan |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password/app password |
| `EMAIL_FROM` | From address for transactional emails |
| `NEXT_PUBLIC_APP_URL` | Full URL of your app (e.g. https://stockflow.app) |
| `CRON_SECRET` | Secret token for authorizing Vercel cron job requests |

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).

2. Copy your project URL and keys from **Settings > API** into `.env.local`.

3. Run the migration in the Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase Dashboard > SQL Editor
```

   Or use the Supabase CLI:

```bash
npx supabase db push
```

4. Authentication is handled by Supabase Auth. No additional configuration needed for email/password login.

## Deployment to Vercel

1. Push your code to GitHub.

2. Import the project in [Vercel](https://vercel.com/new).

3. Set all environment variables from `.env.example` in the Vercel project settings.
   - Use Vercel's secret system for sensitive values (e.g. `@stripe_secret_key`).

4. Add `CRON_SECRET` as a Vercel environment variable and also add it to the `vercel.json` env section.

5. Deploy. Vercel will automatically run `npm run build` and configure the cron job at `/api/alerts/check` every 5 minutes.

## Stripe Setup

1. Create products and prices in the Stripe Dashboard.
2. Copy the Price IDs into your environment variables.
3. Set up a webhook endpoint pointing to `https://your-domain/api/stripe/webhook`.
4. Add the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.
