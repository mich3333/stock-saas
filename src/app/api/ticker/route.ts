import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getStockQuote } from '@/lib/yahoo-finance'

const SYMBOLS = [
  'AAPL',
  'TSLA',
  'GOOGL',
  'MSFT',
  'NVDA',
  'AMZN',
  'SPY',
  'QQQ',
  'BTC-USD',
  'ETH-USD',
  'GC=F',
  'SI=F',
  'CL=F',
  'NG=F',
  'DX-Y.NYB',
  '^TNX',
]
const UPDATE_INTERVAL = 15_000
const HEARTBEAT_INTERVAL = 30_000

interface TickerItem {
  symbol: string
  price: string
  change: string
  positive: boolean
}

function formatTickerSymbol(symbol: string) {
  switch (symbol) {
    case 'BTC-USD':
      return 'BTC'
    case 'ETH-USD':
      return 'ETH'
    case 'GC=F':
      return 'GOLD'
    case 'SI=F':
      return 'SILVER'
    case 'CL=F':
      return 'OIL'
    case 'NG=F':
      return 'NATGAS'
    case 'DX-Y.NYB':
      return 'DXY'
    case '^TNX':
      return 'US10Y'
    default:
      return symbol
  }
}

async function fetchTickers(): Promise<TickerItem[]> {
  const quotes = await Promise.all(
    SYMBOLS.map(async (symbol) => {
      try {
        const q = await getStockQuote(symbol)
        const change = q.regularMarketChangePercent ?? 0
        return {
          symbol: formatTickerSymbol(symbol),
          price: q.regularMarketPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—',
          change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          positive: change >= 0,
        }
      } catch {
        return null
      }
    })
  )
  return quotes.filter(Boolean) as TickerItem[]
}

// SSE streaming handler — clients connect once and receive periodic ticker updates
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    const body = `event: error\ndata: ${JSON.stringify({ error: 'Too Many Requests', retryAfter })}\n\n`
    return new NextResponse(body, {
      status: 429,
      headers: {
        'Content-Type': 'text/event-stream',
        'Retry-After': String(retryAfter),
      },
    })
  }

  let cancelled = false
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (text: string) => {
        if (!cancelled) {
          try {
            controller.enqueue(encoder.encode(text))
          } catch {
            cancelled = true
          }
        }
      }

      const sendTickers = async () => {
        if (cancelled) return
        try {
          const tickers = await fetchTickers()
          if (tickers.length > 0) {
            enqueue(`event: ticker\ndata: ${JSON.stringify(tickers)}\n\n`)
          }
        } catch {
          // silently skip failed fetches; client retains last state
        }
      }

      // Send initial data immediately
      await sendTickers()

      const updateTimer = setInterval(sendTickers, UPDATE_INTERVAL)

      // Keep connection alive through proxies / load balancers
      const heartbeatTimer = setInterval(() => {
        enqueue(': heartbeat\n\n')
      }, HEARTBEAT_INTERVAL)

      request.signal.addEventListener('abort', () => {
        cancelled = true
        clearInterval(updateTimer)
        clearInterval(heartbeatTimer)
        try { controller.close() } catch { /* already closed */ }
      })
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
