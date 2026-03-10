import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { canAddToWatchlist, SubscriptionTier } from '@/lib/tier-limits'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

async function getUserTier(supabase: Awaited<ReturnType<typeof makeSupabase>>, userId: string): Promise<SubscriptionTier> {
  const result = await supabase.from('profiles').select('tier').eq('id', userId).single()
  const row = result.data as { tier: SubscriptionTier } | null
  return row?.tier ?? 'free'
}

export async function GET() {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let { data, error } = await supabase
      .from('watchlists')
      .select('*, watchlist_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    // Auto-create default watchlist if none exists
    if (!error && (!data || data.length === 0)) {
      const { data: created, error: createError } = await supabase
        .from('watchlists')
        .insert({ user_id: user.id, name: 'My Watchlist', is_default: true })
        .select('*, watchlist_items(*)')
        .single()

      if (!createError && created) data = [created]
      error = createError
    }

    return NextResponse.json({ data, error: error?.message || null })
  } catch (error) {
    console.error('GET /api/watchlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { symbol, watchlist_id } = body
    if (!symbol || !watchlist_id) {
      return NextResponse.json({ error: 'Missing required fields: symbol, watchlist_id' }, { status: 400 })
    }

    const tier = await getUserTier(supabase, user.id)

    const { count } = await supabase
      .from('watchlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('watchlist_id', watchlist_id)

    if (!canAddToWatchlist(tier, count || 0)) {
      return NextResponse.json({ error: 'Upgrade to Pro to add more stocks' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({ watchlist_id, user_id: user.id, symbol: symbol.toUpperCase() })
      .select()
      .single()

    return NextResponse.json({ data, error: error?.message || null }, { status: error ? 400 : 201 })
  } catch (error) {
    console.error('POST /api/watchlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing item id' }, { status: 400 })

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: !error, error: error?.message || null })
  } catch (error) {
    console.error('DELETE /api/watchlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
