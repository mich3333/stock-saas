import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getStockQuote } from '@/lib/yahoo-finance'

const SCREENER_SYMBOLS: Record<string, string[]> = {
  Technology:  ['AAPL','MSFT','NVDA','GOOGL','META','AMZN','TSLA','AVGO','AMD','INTC','CSCO','ADBE','CRM','QCOM','TXN','ORCL','IBM','NOW','SNOW','PLTR'],
  Healthcare:  ['JNJ','UNH','LLY','ABBV','MRK','PFE','TMO','ABT','BMY','AMGN','GILD','ISRG','VRTX','REGN','BIIB'],
  Finance:     ['JPM','BAC','WFC','GS','MS','BLK','V','MA','PYPL','AXP','C','SCHW','USB','PNC','TFC'],
  Consumer:    ['WMT','HD','MCD','NKE','SBUX','TGT','COST','PG','KO','PEP','AMZN','LOW','DG','DLTR','YUM'],
  Energy:      ['XOM','CVX','COP','SLB','EOG','MPC','VLO','PSX','OXY','HAL','BP','DVN','FANG','MRO','APA'],
}

export interface ScreenerStock {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  volume: number
  marketCap: number
  pe: number | null
  eps: number | null
  sector: string
}

let cache: { data: ScreenerStock[]; ts: number } | null = null
const CACHE_TTL_MS = 60_000

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ stocks: cache.data, cachedAt: new Date(cache.ts).toISOString(), source: 'cache' })
  }

  const allSymbols = [...new Set(Object.values(SCREENER_SYMBOLS).flat())]
  const symbolToSector: Record<string, string> = {}
  for (const [sector, syms] of Object.entries(SCREENER_SYMBOLS)) {
    for (const sym of syms) symbolToSector[sym] = sector
  }

  try {
    const results = await Promise.allSettled(allSymbols.map((symbol) => getStockQuote(symbol)))
    const live = results
      .map((result, index) => ({ result, symbol: allSymbols[index] }))
      .filter((entry): entry is { result: PromiseFulfilledResult<Awaited<ReturnType<typeof getStockQuote>>>; symbol: string } => entry.result.status === 'fulfilled')
      .map(({ result, symbol }) => ({
        symbol,
        company: result.value.shortName ?? symbol,
        price: result.value.regularMarketPrice ?? 0,
        change: result.value.regularMarketChange ?? 0,
        changePct: result.value.regularMarketChangePercent ?? 0,
        volume: result.value.regularMarketVolume ?? 0,
        marketCap: result.value.marketCap ?? 0,
        pe: result.value.trailingPE ?? null,
        eps: null,
        sector: symbolToSector[symbol] ?? 'Other',
      }))
      .filter((stock, index, stocks) => stocks.findIndex((candidate) => candidate.symbol === stock.symbol) === index)
    if (live.length === 0) {
      return NextResponse.json({ error: 'Live screener data is temporarily unavailable' }, { status: 502 })
    }

    cache = { data: live, ts: Date.now() }
    return NextResponse.json({ stocks: live, cachedAt: new Date().toISOString(), source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Live screener data is temporarily unavailable' }, { status: 502 })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
