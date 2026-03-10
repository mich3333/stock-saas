import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { STOCKS_50 } from '@/lib/stockData'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ results: [] })

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (yahooFinance as any).search(query)
    return NextResponse.json({ results: results.quotes?.slice(0, 10) || [] })
  } catch {
    // Fallback to local mock data search
    const q = query.toLowerCase()
    const results = STOCKS_50
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.company.toLowerCase().includes(q))
      .slice(0, 10)
      .map((s) => ({ symbol: s.symbol, shortname: s.company, sector: s.sector }))
    return NextResponse.json({ results })
  }
}
