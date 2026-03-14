import { NextRequest, NextResponse } from 'next/server'
import { getTierFromPriceId, stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import Stripe from 'stripe'
import { getSupabaseEnv } from '@/lib/env'

function makeAdminSupabase() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient<Database>(url, serviceRoleKey)
}

function getIsoDate(timestamp: number | null | undefined): string | null {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null
}

function getSubscriptionTier(subscription: Stripe.Subscription): 'free' | 'pro' | 'enterprise' {
  const firstItem = subscription.items.data[0]
  return getTierFromPriceId(firstItem?.price?.id)
}

async function syncSubscriptionRecord(
  supabase: ReturnType<typeof makeAdminSupabase>,
  userId: string,
  subscription: Stripe.Subscription,
  customerId?: string | null
) {
  const tier = getSubscriptionTier(subscription)
  const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
  const periodStart = getIsoDate((subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start)
  const periodEnd = getIsoDate((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end)
  const cancelAt = getIsoDate(subscription.cancel_at)

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    tier,
    status,
    stripe_customer_id: customerId ?? (subscription.customer as string),
    stripe_subscription_id: subscription.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: cancelAt,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  }, { onConflict: 'user_id' })

  await supabase.from('profiles').update({
    tier: status === 'active' || status === 'trialing' ? tier : 'free',
  }).eq('id', userId)
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let supabase: ReturnType<typeof makeAdminSupabase>
  try {
    supabase = makeAdminSupabase()
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id

    if (userId && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      await syncSubscriptionRecord(supabase, userId, subscription, session.customer as string)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (data?.user_id) {
      await syncSubscriptionRecord(supabase, data.user_id, subscription)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (data?.user_id) {
      await supabase.from('profiles').update({ tier: 'free' }).eq('id', data.user_id)
      await supabase.from('subscriptions').update({
        tier: 'free',
        status: 'canceled',
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: getIsoDate(subscription.cancel_at),
        current_period_start: getIsoDate((subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start),
        current_period_end: getIsoDate((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end),
      }).eq('stripe_subscription_id', subscription.id)
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    if (customerId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (data?.user_id) {
        await supabase.from('subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)

        await supabase.from('profiles').update({ tier: 'free' }).eq('id', data.user_id)
      }
    }
  }

  return NextResponse.json({ received: true })
}

export function GET() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
