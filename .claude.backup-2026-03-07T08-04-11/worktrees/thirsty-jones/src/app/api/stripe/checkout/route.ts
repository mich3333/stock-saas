import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { Database } from '@/types/database'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = await request.json()
  const priceId = tier === 'pro' ? STRIPE_PRICES.pro : STRIPE_PRICES.enterprise
  if (!priceId || priceId.includes('placeholder')) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/#pricing`,
    customer_email: user.email,
    metadata: { user_id: user.id, tier },
  })

  return NextResponse.json({ url: session.url })
}
