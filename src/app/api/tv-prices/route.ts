import { NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { cacheWrapper, CACHE_TTL } from '@/lib/cache'

// TV symbol → Yahoo Finance symbol
const TV_TO_YF: Record<string, string> = {
  'SP:SPX':          '^GSPC',
  'PEPPERSTONE:NDQ': '^IXIC',
  'DJ:DJI':          '^DJI',
  'CBOE:VIX':        '^VIX',
  'TVC:DXY':         'DX-Y.NYB',
  'NASDAQ:AAPL':     'AAPL',
  'NASDAQ:TSLA':     'TSLA',
  'NASDAQ:NFLX':     'NFLX',
  'NASDAQ:NVDA':     'NVDA',
  'TVC:USOIL':       'CL=F',
  'TVC:GOLD':        'GC=F',
  'TVC:SILVER':      'SI=F',
  'FX:EURUSD':       'EURUSD=X',
  'FX:GBPUSD':       'GBPUSD=X',
  'FX_IDC:USDJPY':   'USDJPY=X',
  'BINANCE:BTCUSDT': 'BTC-USD',
  'BINANCE:ETHUSDT': 'ETH-USD',
}

export async function POST(request: Request) {
  try {
    const { symbols } = await request.json()
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array required' }, { status: 400 })
    }

    const results = await Promise.allSettled(
      symbols.map(async (tvSym: string) => {
        const yfSym = TV_TO_YF[tvSym] ?? tvSym
        const quote = await cacheWrapper(
          `tv-price:${tvSym}`,
          CACHE_TTL.STOCK_QUOTE,
          () => getStockQuote(yfSym)
        )
        return {
          symbol: tvSym,
          price: quote.regularMarketPrice ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          change: quote.regularMarketChange ?? 0,
          volume: quote.regularMarketVolume ?? 0,
          name: quote.shortName ?? tvSym,
        }
      })
    )

    const data = results
      .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled')
      .map((r) => r.value)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[tv-prices]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
