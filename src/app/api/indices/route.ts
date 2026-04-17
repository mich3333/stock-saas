import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { CACHE_TTL, cacheWrapper } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limiter'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500', category: 'Index' },
  { symbol: '^IXIC', name: 'NASDAQ', category: 'Index' },
  { symbol: '^DJI', name: 'DOW JONES', category: 'Index' },
  { symbol: 'GC=F', name: 'Gold', category: 'Commodity' },
  { symbol: 'SI=F', name: 'Silver', category: 'Commodity' },
  { symbol: 'CL=F', name: 'Crude Oil', category: 'Commodity' },
  { symbol: 'NG=F', name: 'Natural Gas', category: 'Commodity' },
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'Crypto' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index', category: 'Macro' },
  { symbol: '^TNX', name: '10Y Treasury Yield', category: 'Macro' },
]

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }
  try {
    const results = await Promise.allSettled(
      INDICES.map(({ symbol, name, category }) =>
        cacheWrapper(`index:${symbol}`, CACHE_TTL.STOCK_QUOTE, () => getStockQuote(symbol)).then(
          (quote) => ({
            name,
            symbol,
            category,
            value: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            isPositive: quote.regularMarketChange >= 0,
            volume: quote.regularMarketVolume,
            dayHigh: quote.regularMarketDayHigh,
            dayLow: quote.regularMarketDayLow,
          })
        )
      )
    )

    const indices = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      // fallback static values if Yahoo fails
      return FALLBACK[i]
    })

    return NextResponse.json({ indices }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch {
    return NextResponse.json({ indices: FALLBACK }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }

const FALLBACK = [
  { name: 'S&P 500', symbol: '^GSPC', category: 'Index', value: 5123.69, change: 12.45, changePercent: 0.24, isPositive: true, volume: 0, dayHigh: 5138.11, dayLow: 5090.44 },
  { name: 'NASDAQ', symbol: '^IXIC', category: 'Index', value: 16274.94, change: -8.12, changePercent: -0.05, isPositive: false, volume: 0, dayHigh: 16312.67, dayLow: 16188.22 },
  { name: 'DOW JONES', symbol: '^DJI', category: 'Index', value: 38671.69, change: 56.78, changePercent: 0.15, isPositive: true, volume: 0, dayHigh: 38792.25, dayLow: 38488.17 },
  { name: 'Gold', symbol: 'GC=F', category: 'Commodity', value: 2188.4, change: 9.7, changePercent: 0.45, isPositive: true, volume: 0, dayHigh: 2193.2, dayLow: 2172.8 },
  { name: 'Silver', symbol: 'SI=F', category: 'Commodity', value: 24.73, change: -0.18, changePercent: -0.72, isPositive: false, volume: 0, dayHigh: 24.98, dayLow: 24.51 },
  { name: 'Crude Oil', symbol: 'CL=F', category: 'Commodity', value: 78.61, change: 0.94, changePercent: 1.21, isPositive: true, volume: 0, dayHigh: 79.03, dayLow: 77.42 },
  { name: 'Natural Gas', symbol: 'NG=F', category: 'Commodity', value: 1.84, change: -0.04, changePercent: -2.13, isPositive: false, volume: 0, dayHigh: 1.91, dayLow: 1.81 },
  { name: 'Bitcoin', symbol: 'BTC-USD', category: 'Crypto', value: 67420, change: 2056, changePercent: 3.14, isPositive: true, volume: 0, dayHigh: 67988, dayLow: 65110 },
  { name: 'Ethereum', symbol: 'ETH-USD', category: 'Crypto', value: 3456.78, change: 87.32, changePercent: 2.59, isPositive: true, volume: 0, dayHigh: 3498.20, dayLow: 3351.40 },
  { name: 'US Dollar Index', symbol: 'DX-Y.NYB', category: 'Macro', value: 104.12, change: 0.23, changePercent: 0.22, isPositive: true, volume: 0, dayHigh: 104.35, dayLow: 103.88 },
  { name: '10Y Treasury Yield', symbol: '^TNX', category: 'Macro', value: 4.32, change: -0.05, changePercent: -1.14, isPositive: false, volume: 0, dayHigh: 4.38, dayLow: 4.28 },
]
