import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { canAddToWatchlist, SubscriptionTier } from '@/lib/tier-limits'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createLogger } from '@/lib/logger'
import { getSupabaseEnv } from '@/lib/env'
import { sanitizeSymbol, validateSymbol } from '@/lib/security'

const log = createLogger('api/watchlist')

async function makeSupabase() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    url,
    anonKey,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

async function getUserTier(supabase: Awaited<ReturnType<typeof makeSupabase>>, userId: string): Promise<SubscriptionTier> {
  const result = await supabase.from('profiles').select('tier').eq('id', userId).single()
  const row = result.data as { tier: SubscriptionTier } | null
  return row?.tier ?? 'free'
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    let supabase: Awaited<ReturnType<typeof makeSupabase>>
    try {
      supabase = await makeSupabase()
    } catch {
      return NextResponse.json({ data: [] })
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: [] })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

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
    log.error('GET /api/watchlist error', error)
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const body = await request.json()
    const { symbol, watchlist_id } = body
    if (!symbol || !watchlist_id) {
      return NextResponse.json({ error: 'Missing required fields: symbol, watchlist_id' }, { status: 400 })
    }
    const upperSymbol = sanitizeSymbol(String(symbol))
    if (!validateSymbol(upperSymbol)) {
      return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 })
    }

    const { count } = await supabase
      .from('watchlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('watchlist_id', watchlist_id)

    if (!canAddToWatchlist(tier, count || 0)) {
      return NextResponse.json(
        { error: 'Upgrade to Pro to add more stocks', upgradeUrl: '/pricing' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({ watchlist_id, user_id: user.id, symbol: upperSymbol })
      .select()
      .single()

    return NextResponse.json({ data, error: error?.message || null }, { status: error ? 400 : 201 })
  } catch (error) {
    log.error('POST /api/watchlist error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing item id' }, { status: 400 })

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: !error, error: error?.message || null })
  } catch (error) {
    log.error('DELETE /api/watchlist error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
