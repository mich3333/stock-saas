import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote, getHistoricalData } from '@/lib/yahoo-finance'
import { CACHE_TTL, cacheWrapper } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { SubscriptionTier } from '@/lib/tier-limits'
import { STOCKS_50 } from '@/lib/stockData'

function getMockQuote(symbol: string) {
  const stock = STOCKS_50.find((s) => s.symbol === symbol)
  if (!stock) return null
  const jitter = (Math.random() - 0.5) * stock.price * 0.002
  return {
    symbol: stock.symbol,
    shortName: stock.company,
    regularMarketPrice: +(stock.price + jitter).toFixed(2),
    regularMarketChange: +(stock.change + jitter).toFixed(2),
    regularMarketChangePercent: +stock.changePct.toFixed(2),
    regularMarketVolume: stock.volume,
    marketCap: stock.marketCap,
    trailingPE: stock.pe,
    fiftyTwoWeekHigh: stock.week52High,
    fiftyTwoWeekLow: stock.week52Low,
  }
}

function getMockHistory(symbol: string) {
  const stock = STOCKS_50.find((s) => s.symbol === symbol)
  const basePrice = stock?.price ?? 100
  const now = Date.now()
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000)
    const open = basePrice * (0.95 + Math.random() * 0.1)
    const close = basePrice * (0.95 + Math.random() * 0.1)
    return {
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +(Math.max(open, close) * (1 + Math.random() * 0.02)).toFixed(2),
      low: +(Math.min(open, close) * (1 - Math.random() * 0.02)).toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(stock?.volume ?? 1000000 * (0.8 + Math.random() * 0.4)),
    }
  })
}

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

    const quote = await cacheWrapper(`quote:${sym}`, CACHE_TTL.STOCK_QUOTE, () => getStockQuote(sym))

    if (includeHistory) {
      const history = await cacheWrapper(`history:${sym}:${period}`, CACHE_TTL.HISTORICAL, () => getHistoricalData(sym, period))
      return NextResponse.json({ quote, history })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Stock fetch error, falling back to mock data:', error)
    const { symbol } = await params
    const sym = symbol.toUpperCase()
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const quote = getMockQuote(sym)
    if (!quote) return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    if (includeHistory) {
      return NextResponse.json({ quote, history: getMockHistory(sym) })
    }
    return NextResponse.json({ quote })
  }
}
