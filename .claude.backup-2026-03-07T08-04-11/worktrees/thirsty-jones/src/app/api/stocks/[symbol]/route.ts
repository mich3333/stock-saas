import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote, getHistoricalData } from '@/lib/yahoo-finance'
import { cache, CACHE_TTL } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { SubscriptionTier } from '@/lib/tier-limits'

async function getUserTier(): Promise<SubscriptionTier> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'
    const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
    return (data as { tier: SubscriptionTier } | null)?.tier ?? 'free'
  } catch {
    return 'free'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const tier = await getUserTier()
  const { allowed, retryAfter } = checkRateLimit(ip, tier)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { symbol } = await params
    const sym = symbol.toUpperCase()
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const period = (searchParams.get('period') as '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y') || '1mo'

    const cacheKey = `quote:${sym}`
    let quote = cache.get(cacheKey)
    if (!quote) {
      quote = await getStockQuote(sym)
      cache.set(cacheKey, quote, CACHE_TTL.STOCK_QUOTE)
    }

    if (includeHistory) {
      const histKey = `history:${sym}:${period}`
      let history = cache.get(histKey)
      if (!history) {
        history = await getHistoricalData(sym, period)
        cache.set(histKey, history, CACHE_TTL.HISTORICAL)
      }
      return NextResponse.json({ quote, history })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Stock fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
