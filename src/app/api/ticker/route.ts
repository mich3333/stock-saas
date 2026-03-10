import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

const SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA', 'AMZN', 'META', 'AMD', 'NFLX', 'JPM', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'DIS']

export async function GET() {
  try {
    const quotes = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const q = await yahooFinance.quote(symbol) as any
          const change = q.regularMarketChangePercent ?? 0
          return {
            symbol: symbol.replace('-USD', ''),
            price: q.regularMarketPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—',
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            positive: change >= 0,
          }
        } catch {
          return null
        }
      })
    )
    const filtered = quotes.filter(Boolean)
    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' }
    })
  } catch (error) {
    console.error('Ticker error:', error)
    return NextResponse.json({ error: 'Failed to fetch ticker' }, { status: 500 })
  }
}
