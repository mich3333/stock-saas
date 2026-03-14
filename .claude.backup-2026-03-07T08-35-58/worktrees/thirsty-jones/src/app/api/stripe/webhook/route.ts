import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import Stripe from 'stripe'

function makeAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
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

  const supabase = makeAdminSupabase()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const tier = session.metadata?.tier as 'pro' | 'enterprise' | undefined

    if (userId && tier) {
      await supabase.from('profiles').update({ tier }).eq('id', userId)
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        tier,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }, { onConflict: 'user_id' })
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
      const status = subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
      const sub = subscription as unknown as { current_period_start?: number; current_period_end?: number }
      const periodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString()
        : null
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null
      await supabase.from('subscriptions').update({
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id)

      if (status === 'past_due' || status === 'canceled') {
        await supabase.from('profiles').update({ tier: 'free' }).eq('id', data.user_id)
      }
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
      await supabase.from('subscriptions').update({ tier: 'free', status: 'canceled' }).eq('stripe_subscription_id', subscription.id)
    }
  }

  return NextResponse.json({ received: true })
}
