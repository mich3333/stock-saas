import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

const EARNINGS_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
  'JPM', 'V', 'WMT', 'JNJ', 'PG', 'UNH', 'HD',
]

interface EarningsItem {
  symbol: string
  companyName: string
  reportDate: string
  epsEstimate: number | null
  period: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const symbols = symbolsParam ? symbolsParam.split(',') : EARNINGS_SYMBOLS

    const earnings: EarningsItem[] = []

    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const data = await yahooFinance.quoteSummary(sym.toUpperCase(), {
          modules: ['calendarEvents', 'quoteType'],
        }) as Record<string, any>

        const calendarEvents = data.calendarEvents as Record<string, any> | undefined
        const companyName = (data.quoteType?.shortName || data.quoteType?.longName || sym) as string

        if (calendarEvents?.earnings) {
          const earningsDate = calendarEvents.earnings.earningsDate?.[0]
          if (earningsDate) {
            const dateStr = typeof earningsDate === 'string'
              ? earningsDate
              : earningsDate instanceof Date
                ? earningsDate.toISOString().split('T')[0]
                : String(earningsDate)

            return {
              symbol: sym.toUpperCase(),
              companyName: companyName || sym,
              reportDate: dateStr,
              epsEstimate: calendarEvents.earnings.earningsAverage ?? null,
              period: calendarEvents.earnings.earningsQuarter || '',
            }
          }
        }
        return null
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        earnings.push(r.value)
      }
    }

    // Sort by date
    earnings.sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())

    return NextResponse.json({ earnings })
  } catch {
    return NextResponse.json({ earnings: [] })
  }
}
