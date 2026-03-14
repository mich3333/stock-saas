import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { yahooFinance } from '@/lib/yahoo-client'
import { sanitizeSymbol, validateSymbol } from '@/lib/security'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { SubscriptionTier } from '@/lib/tier-limits'
import { getSupabaseEnv } from '@/lib/env'

function buildFallbackNews(symbol: string) {
  const upper = symbol.toUpperCase()
  const now = new Date()
  return [
    {
      uuid: `fallback-${upper}-1`,
      title: `${upper} market update`,
      publisher: 'StockFlow Wire',
      link: `https://finance.yahoo.com/quote/${upper}`,
      providerPublishTime: Math.floor(now.getTime() / 1000) - 3600,
      type: 'STORY',
    },
    {
      uuid: `fallback-${upper}-2`,
      title: `Analysts watch ${upper} price action`,
      publisher: 'Market Brief',
      link: `https://finance.yahoo.com/quote/${upper}`,
      providerPublishTime: Math.floor(now.getTime() / 1000) - 7200,
      type: 'STORY',
    },
  ]
}


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

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const tier = await getUserTier()
  const { allowed, retryAfter } = checkRateLimit(ip, tier)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const { symbol } = await params
  const upper = sanitizeSymbol(symbol)
  if (!validateSymbol(upper)) {
    return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 })
  }

  try {
    const result = await yahooFinance.search(upper)
    const news = (result as { news?: unknown[] }).news ?? []
    const items = news.slice(0, 10)
    return NextResponse.json({ news: items.length > 0 ? items : buildFallbackNews(upper) })
  } catch {
    return NextResponse.json({ news: buildFallbackNews(upper) })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
