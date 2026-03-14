import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote, getHistoricalData } from '@/lib/yahoo-finance'
import { CACHE_TTL, cacheWrapper } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'
import { sanitizeSymbol, validateSymbol } from '@/lib/security'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { SubscriptionTier } from '@/lib/tier-limits'
import { getSupabaseEnv } from '@/lib/env'

async function getUserTier(): Promise<SubscriptionTier> {
  try {
    const { url, anonKey } = getSupabaseEnv()
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      url,
      anonKey,
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

  const VALID_PERIODS = new Set(['1mo', '3mo', '6mo', '1y', '2y', '5y'])

  try {
    const { symbol } = await params
    const sym = sanitizeSymbol(symbol)
    if (!validateSymbol(sym)) {
      return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
    }
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const rawPeriod = searchParams.get('period') ?? '1mo'
    const period = (VALID_PERIODS.has(rawPeriod) ? rawPeriod : '1mo') as '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'

    const quote = await cacheWrapper(`quote:${sym}`, CACHE_TTL.STOCK_QUOTE, () => getStockQuote(sym))

    if (includeHistory) {
      const history = await cacheWrapper(`history:${sym}:${period}`, CACHE_TTL.HISTORICAL, () => getHistoricalData(sym, period))
      return NextResponse.json({ quote, history })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Stock fetch error', error)
    return NextResponse.json(
      { error: 'Live market data is temporarily unavailable for this symbol' },
      { status: 502 }
    )
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
