import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover' as any,
})

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
}

export const PLANS = {
  free: { name: 'Free', price: 0, priceId: null },
  pro: { name: 'Pro', price: 29, priceId: STRIPE_PRICES.pro },
  enterprise: { name: 'Enterprise', price: 99, priceId: STRIPE_PRICES.enterprise },
}
