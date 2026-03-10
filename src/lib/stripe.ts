import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover' as any,
})

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null as string | null,
    apiCallsPerMin: 5,
    features: ['Basic stock quotes', 'Single watchlist (5 items)', 'Basic charts'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: STRIPE_PRICES.pro,
    apiCallsPerMin: 300,
    features: ['300 API calls/min', 'Full charting & indicators', 'Price alerts', 'Portfolio tracking', '10 watchlists', 'CSV export'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    priceId: STRIPE_PRICES.enterprise,
    apiCallsPerMin: 1000,
    features: ['1000 API calls/min', 'Everything in Pro', 'Unlimited watchlists', 'API access', 'Priority support', 'Custom integrations'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) {
    const customer = existing.data[0]
    if (!customer.metadata.user_id) {
      await stripe.customers.update(customer.id, { metadata: { user_id: userId } })
    }
    return customer.id
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  })
  return customer.id
}

export async function getUserSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })
  return subscriptions.data[0] || null
}

// Usage tracking — logs API calls for internal analytics
// Metered billing via Stripe Billing Meter Events can be wired up when needed
export async function recordApiUsage(_customerId: string, _quantity: number = 1): Promise<void> {
  // No-op placeholder: integrate with stripe.billing.meterEvents.create when metered billing is configured
}
