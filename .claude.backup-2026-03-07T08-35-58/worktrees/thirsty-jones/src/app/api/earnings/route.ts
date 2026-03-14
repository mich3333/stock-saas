import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') || 'AAPL'
    const quote = await yahooFinance.quoteSummary(symbol.toUpperCase(), { modules: ['calendarEvents', 'earnings'] })
    return NextResponse.json({ data: quote })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}
