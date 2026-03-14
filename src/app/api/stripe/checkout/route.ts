import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getOrCreateCustomer, getPlanPriceId, getStripeConfigStatus, stripe } from '@/lib/stripe'
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

export async function POST(request: NextRequest) {
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

    const { tier } = await request.json()
    if (tier !== 'pro' && tier !== 'enterprise') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'Authenticated user is missing an email address' }, { status: 400 })
    }

    const priceId = getPlanPriceId(tier)
    if (!priceId) {
      return NextResponse.json({ error: `Stripe price is not configured for ${tier}` }, { status: 503 })
    }

    const customerId = await getOrCreateCustomer(user.id, user.email)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?billing=checkout_success`,
      cancel_url: `${appUrl}/pricing?billing=checkout_canceled`,
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      metadata: { user_id: user.id, tier, email: user.email },
      subscription_data: {
        metadata: { user_id: user.id, tier, email: user.email },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/stripe/checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function GET() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } }) }
