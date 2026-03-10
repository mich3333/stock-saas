import { NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { CACHE_TTL, cacheWrapper } from '@/lib/cache'

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'DOW JONES' },
]

export async function GET() {
  try {
    const results = await Promise.allSettled(
      INDICES.map(({ symbol, name }) =>
        cacheWrapper(`index:${symbol}`, CACHE_TTL.STOCK_QUOTE, () => getStockQuote(symbol)).then(
          (quote) => ({
            name,
            symbol,
            value: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            isPositive: quote.regularMarketChange >= 0,
          })
        )
      )
    )

    const indices = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      // fallback static values if Yahoo fails
      return FALLBACK[i]
    })

    return NextResponse.json({ indices })
  } catch {
    return NextResponse.json({ indices: FALLBACK })
  }
}

const FALLBACK = [
  { name: 'S&P 500', symbol: '^GSPC', value: 5200, change: 0, changePercent: 0, isPositive: true },
  { name: 'NASDAQ', symbol: '^IXIC', value: 16400, change: 0, changePercent: 0, isPositive: true },
  { name: 'DOW JONES', symbol: '^DJI', value: 39000, change: 0, changePercent: 0, isPositive: true },
]
