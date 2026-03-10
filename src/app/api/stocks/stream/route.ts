import { NextRequest } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { wsManager } from '@/lib/websocket-manager'
import { cache, CACHE_TTL } from '@/lib/cache'
import { STOCKS_50 } from '@/lib/stockData'

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
    const data = {
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

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols')
  if (!symbolsParam) {
    return new Response(JSON.stringify({ error: 'symbols parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase()).slice(0, 20)
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const symbol of symbols) {
        wsManager.subscribe(symbol, controller)
      }

      const sendUpdates = async () => {
        if (cancelled) return
        const quotes = await Promise.all(symbols.map((s) => fetchQuote(s)))
        for (const quote of quotes) {
          if (quote && !cancelled) {
            wsManager.broadcast(quote.symbol, quote)
          }
        }
      }

      // Send initial data immediately
      sendUpdates()

      // Then update every 5 seconds
      const interval = setInterval(sendUpdates, 5000)

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        cancelled = true
        clearInterval(interval)
        wsManager.unsubscribeAll(controller)
      })
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
