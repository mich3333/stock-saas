import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { TIER_LIMITS, SubscriptionTier } from '@/lib/tier-limits'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function GET() {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profileResult = await supabase.from('profiles').select('tier').eq('id', user.id).single()
    const profile = profileResult.data as { tier: SubscriptionTier } | null

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const tier: SubscriptionTier = profile?.tier ?? 'free'

    return NextResponse.json({ subscription, tier, limits: TIER_LIMITS[tier] })
  } catch (error) {
    console.error('GET /api/subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ received: true })
}
