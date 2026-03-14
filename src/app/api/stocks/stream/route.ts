import { NextRequest } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { wsManager } from '@/lib/websocket-manager'
import { cache, CACHE_TTL } from '@/lib/cache'
import { STOCKS_50 } from '@/lib/stockData'
import { createLogger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limiter'
import { validateSymbol } from '@/lib/security'

const log = createLogger('api/stocks/stream')
const HEARTBEAT_INTERVAL = 15_000
const UPDATE_INTERVAL = 5_000
const MAX_SYMBOLS = 20

function getMockPrice(symbol: string) {
  const stock = STOCKS_50.find((s) => s.symbol === symbol)
  if (!stock) return null
  const jitter = (Math.random() - 0.5) * stock.price * 0.002
  const price = stock.price + jitter
  const change = stock.change + jitter
  const changePct = (change / (price - change)) * 100
  return {
    symbol: stock.symbol,
    shortName: stock.company,
    regularMarketPrice: +price.toFixed(2),
    regularMarketChange: +change.toFixed(2),
    regularMarketChangePercent: +changePct.toFixed(2),
    regularMarketVolume: stock.volume,
    marketCap: stock.marketCap,
    timestamp: Date.now(),
  }
}

interface StreamQuote {
  symbol: string
  shortName: string | null
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  marketCap: number | null
  timestamp: number
}

async function fetchQuote(symbol: string): Promise<StreamQuote | null> {
  const cacheKey = `stream:${symbol}`
  const cached = cache.get<StreamQuote>(cacheKey)
  if (cached) return cached

  try {
    const quote = await getStockQuote(symbol)
    const data: StreamQuote = {
      symbol: quote.symbol,
      shortName: quote.shortName,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      regularMarketVolume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      timestamp: Date.now(),
    }
    cache.set(cacheKey, data, CACHE_TTL.STOCK_QUOTE)
    return data
  } catch {
    return getMockPrice(symbol)
  }
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return new Response(sseEvent('error', { message: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'text/event-stream', 'Retry-After': String(retryAfter) },
    })
  }

  const symbolsParam = request.nextUrl.searchParams.get('symbols')
  if (!symbolsParam) {
    return new Response(sseEvent('error', { message: 'symbols parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => validateSymbol(s))
    .slice(0, MAX_SYMBOLS)

  if (symbols.length === 0) {
    return new Response(sseEvent('error', { message: 'No valid symbols provided' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  let cancelled = false
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const symbol of symbols) {
        wsManager.subscribe(symbol, controller)
      }

      const enqueue = (text: string) => {
        if (!cancelled) {
          try {
            controller.enqueue(encoder.encode(text))
          } catch {
            cancelled = true
          }
        }
      }

      const sendUpdates = async () => {
        if (cancelled) return
        try {
          const quotes = await Promise.allSettled(symbols.map((s) => fetchQuote(s)))
          for (const [i, result] of quotes.entries()) {
            if (!cancelled) {
              if (result.status === 'fulfilled' && result.value) {
                wsManager.broadcast(symbols[i], result.value)
                enqueue(sseEvent('quote', result.value))
              }
            }
          }
        } catch (err) {
          log.error('sendUpdates failed', err)
        }
      }

      // Initial data + periodic updates
      sendUpdates()
      const updateTimer = setInterval(sendUpdates, UPDATE_INTERVAL)

      // Heartbeat to keep connection alive through proxies
      const heartbeatTimer = setInterval(() => {
        enqueue(': heartbeat\n\n')
      }, HEARTBEAT_INTERVAL)

      request.signal.addEventListener('abort', () => {
        cancelled = true
        clearInterval(updateTimer)
        clearInterval(heartbeatTimer)
        wsManager.unsubscribeAll(controller)
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
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
