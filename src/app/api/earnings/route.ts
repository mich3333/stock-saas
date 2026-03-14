import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { yahooFinance } from '@/lib/yahoo-client'
import { validateSymbol } from '@/lib/security'
const MAX_SYMBOLS = 20

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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const { allowed, retryAfter } = checkRateLimit(ip, 'free')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const rawSymbols = symbolsParam ? symbolsParam.split(',') : EARNINGS_SYMBOLS
    const symbols = rawSymbols
      .map(s => s.trim().toUpperCase())
      .filter(s => validateSymbol(s))
      .slice(0, MAX_SYMBOLS)

    const earnings: EarningsItem[] = []

    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await yahooFinance.quoteSummary(sym.toUpperCase(), {
          modules: ['calendarEvents', 'quoteType'],
        }) as Record<string, any>

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
