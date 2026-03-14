import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    if (!query) return NextResponse.json({ results: [] })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (yahooFinance as any).search(query)
    return NextResponse.json({ results: results.quotes?.slice(0, 10) || [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
