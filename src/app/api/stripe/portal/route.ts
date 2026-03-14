import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrCreateCustomer, getStripeConfigStatus, stripe } from '@/lib/stripe'
import { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'

async function makeSupabase() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    url,
    anonKey,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function POST() {
  const stripeConfig = getStripeConfigStatus()
  if (!stripeConfig.valid) {
    return NextResponse.json(
      { error: `Stripe not configured: missing ${stripeConfig.missing.join(', ')}` },
      { status: 503 }
    )
  }

  try {
    let supabase: Awaited<ReturnType<typeof makeSupabase>>
    try {
      supabase = await makeSupabase()
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .single()

    if (!sub?.stripe_customer_id && !user.email) {
      return NextResponse.json({ error: 'No billing profile found for this account yet' }, { status: 404 })
    }

    if (!sub?.stripe_customer_id && user.email) {
      return NextResponse.json(
        { error: 'No payment method or paid subscription found yet. Upgrade first to create a billing profile.' },
        { status: 404 }
      )
    }

    if (!sub?.stripe_subscription_id && sub?.status !== 'active' && sub?.status !== 'trialing') {
      return NextResponse.json(
        { error: 'No active billing profile found. Upgrade first to manage payment methods.' },
        { status: 404 }
      )
    }

    const customerId = sub?.stripe_customer_id ?? await getOrCreateCustomer(user.id, user.email!)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings?billing=portal_returned`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/stripe/portal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function GET() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
