# StockFlow Deployment Guide

## Prerequisites
- Supabase account
- Vercel account
- Stripe account (for payments)
- SMTP credentials (for email alerts)

## 1. Supabase Setup
1. Create new Supabase project at supabase.com
2. Go to SQL Editor and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and keys from Settings > API
4. Enable email auth in Authentication > Providers

## 2. Stripe Setup
1. Create Stripe account at stripe.com
2. Create two products: "Pro" ($29/mo) and "Enterprise" ($99/mo)
3. Copy the Price IDs for each product
4. Set up webhook pointing to `https://your-domain.com/api/stripe/webhook`
5. Add events: `checkout.session.completed`, `customer.subscription.deleted`

## 3. Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.example`
4. Deploy!

## 4. Post-Deploy
- Test auth flow (signup/login)
- Test stock data fetching
- Test Stripe checkout with test card: 4242 4242 4242 4242

## Environment Variables
See `.env.example` for all required variables.
