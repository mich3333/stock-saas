import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'
import { checkRateLimit } from '@/lib/rate-limiter'
import { SubscriptionTier } from '@/lib/tier-limits'
import { sanitizeSymbol, validateSymbol } from '@/lib/security'
import { getStockQuote } from '@/lib/yahoo-finance'

async function getUserTier(supabase: Awaited<ReturnType<typeof makeSupabase>>, userId: string): Promise<SubscriptionTier> {
  try {
    const { data } = await supabase.from('profiles').select('tier').eq('id', userId).single()
    return (data as { tier: SubscriptionTier } | null)?.tier ?? 'free'
  } catch {
    return 'free'
  }
}

async function makeSupabase() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    url,
    anonKey,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
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

  const { data: rawPositions, error } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ data: [], error: 'Failed to load portfolio' })

  type PositionRow = Database['public']['Tables']['portfolio_positions']['Row']
  const positions = (rawPositions || []) as PositionRow[]

  // Fetch current prices for all symbols
  const symbols = positions.map(p => p.symbol)
  const quotes: Record<string, { price: number; change: number; changePercent: number }> = {}

  if (symbols.length > 0) {
    try {
      const results = await Promise.allSettled(
        symbols.map(async (sym) => {
          const q = await getStockQuote(sym)
          return {
            symbol: sym,
            price: q.regularMarketPrice ?? 0,
            change: q.regularMarketChange ?? 0,
            changePercent: q.regularMarketChangePercent ?? 0,
          }
        })
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          quotes[r.value.symbol] = r.value
        }
      }
    } catch {
      // Continue with positions without live prices
    }
  }

  const portfolio = (positions || []).map(p => ({
    id: p.id,
    symbol: p.symbol,
    shares: p.shares,
    avgPrice: p.avg_price,
    currentPrice: quotes[p.symbol]?.price ?? null,
    change: quotes[p.symbol]?.change ?? null,
    changePercent: quotes[p.symbol]?.changePercent ?? null,
  }))

  return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('GET /api/portfolio error:', error)
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
    const { symbol, shares, avg_price } = body
    if (!symbol || shares == null || avg_price == null) {
      return NextResponse.json({ error: 'Missing required fields: symbol, shares, avg_price' }, { status: 400 })
    }
    const upperSymbol = sanitizeSymbol(String(symbol))
    if (!validateSymbol(upperSymbol)) {
      return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 })
    }
    const sharesNum = Number(shares)
    const avgPriceNum = Number(avg_price)
    if (!Number.isFinite(sharesNum) || sharesNum <= 0) {
      return NextResponse.json({ error: 'shares must be a positive number' }, { status: 400 })
    }
    if (!Number.isFinite(avgPriceNum) || avgPriceNum <= 0) {
      return NextResponse.json({ error: 'avg_price must be a positive number' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('portfolio_positions')
      .insert({
        user_id: user.id,
        symbol: upperSymbol,
        shares: sharesNum,
        avg_price: avgPriceNum,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to add position' }, { status: 400 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portfolio error:', error)
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
    if (!id) return NextResponse.json({ error: 'Missing position id' }, { status: 400 })

    const { error } = await supabase
      .from('portfolio_positions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to delete position' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
