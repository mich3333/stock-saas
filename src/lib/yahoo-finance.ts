import { cacheWrapper, CACHE_TTL } from './cache'
import { yahooFinance } from './yahoo-client'

export interface StockQuote {
  symbol: string
  shortName: string | null
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  marketCap: number | null
  trailingPE: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  currency: string
}

export class YahooFinanceError extends Error {
  constructor(
    message: string,
    public readonly symbol: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'YahooFinanceError'
  }
}

type PolygonSnapshotResponse = {
  ticker?: {
    ticker?: string
    todaysChange?: number
    todaysChangePerc?: number
    day?: {
      c?: number
      h?: number
      l?: number
      v?: number
    }
    prevDay?: {
      c?: number
    }
  }
}

const POLYGON_BASE_URL = 'https://api.polygon.io'

function getPolygonApiKey() {
  const apiKey = process.env.POLYGON_API_KEY
  return apiKey && apiKey.trim() ? apiKey.trim() : null
}

function isPolygonEligibleSymbol(symbol: string) {
  return /^[A-Z0-9.]+$/.test(symbol) && !symbol.includes('^')
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

function normalizeQuote(
  // yahoo-finance2 doesn't export a stable quote type, use unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: Record<string, any>
): StockQuote {
  return {
    symbol: q.symbol,
    shortName: q.shortName ?? null,
    regularMarketPrice: q.regularMarketPrice ?? 0,
    regularMarketChange: q.regularMarketChange ?? 0,
    regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
    regularMarketVolume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? null,
    trailingPE: q.trailingPE ?? null,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
    regularMarketDayHigh: q.regularMarketDayHigh ?? 0,
    regularMarketDayLow: q.regularMarketDayLow ?? 0,
    currency: q.currency ?? 'USD',
  }
}

async function fetchYahooRawQuote(symbol: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return withRetry(() => yahooFinance.quote(symbol)) as Promise<Record<string, any>>
}

async function fetchPolygonQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = getPolygonApiKey()
  if (!apiKey || !isPolygonEligibleSymbol(symbol)) return null

  const response = await fetch(
    `${POLYGON_BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}?apiKey=${apiKey}`,
    { next: { revalidate: 30 } }
  )

  if (!response.ok) {
    throw new Error(`Polygon quote failed with HTTP ${response.status}`)
  }

  const payload = await response.json() as PolygonSnapshotResponse
  const snapshot = payload.ticker
  if (!snapshot?.ticker || typeof snapshot.day?.c !== 'number') return null

  let enriched: Record<string, any> | null = null
  try {
    enriched = await fetchYahooRawQuote(symbol)
  } catch {
    enriched = null
  }

  return {
    symbol: snapshot.ticker,
    shortName: enriched?.shortName ?? null,
    regularMarketPrice: snapshot.day?.c ?? 0,
    regularMarketChange: snapshot.todaysChange ?? (snapshot.day?.c ?? 0) - (snapshot.prevDay?.c ?? 0),
    regularMarketChangePercent: snapshot.todaysChangePerc ?? 0,
    regularMarketVolume: snapshot.day?.v ?? enriched?.regularMarketVolume ?? 0,
    marketCap: enriched?.marketCap ?? null,
    trailingPE: enriched?.trailingPE ?? null,
    fiftyTwoWeekHigh: enriched?.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: enriched?.fiftyTwoWeekLow ?? 0,
    regularMarketDayHigh: snapshot.day?.h ?? enriched?.regularMarketDayHigh ?? 0,
    regularMarketDayLow: snapshot.day?.l ?? enriched?.regularMarketDayLow ?? 0,
    currency: enriched?.currency ?? 'USD',
  }
}

async function fetchPolygonHistory(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'
): Promise<ChartPoint[] | null> {
  const apiKey = getPolygonApiKey()
  if (!apiKey || !isPolygonEligibleSymbol(symbol)) return null

  const from = getStartDate(period).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]
  const response = await fetch(
    `${POLYGON_BASE_URL}/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${apiKey}`,
    { next: { revalidate: 60 } }
  )

  if (!response.ok) {
    throw new Error(`Polygon history failed with HTTP ${response.status}`)
  }

  const payload = await response.json() as {
    results?: Array<{ t?: number; o?: number; h?: number; l?: number; c?: number; v?: number }>
  }

  if (!Array.isArray(payload.results) || payload.results.length === 0) return null

  return payload.results
    .filter((row) => typeof row.t === 'number')
    .map((row) => ({
      date: new Date(row.t as number).toISOString().split('T')[0],
      open: row.o ?? 0,
      high: row.h ?? 0,
      low: row.l ?? 0,
      close: row.c ?? 0,
      volume: row.v ?? 0,
    }))
}

async function fetchPolygonSymbolSearch(query: string) {
  const apiKey = getPolygonApiKey()
  if (!apiKey) return null

  const response = await fetch(
    `${POLYGON_BASE_URL}/v3/reference/tickers?market=stocks&active=true&limit=10&search=${encodeURIComponent(query)}&apiKey=${apiKey}`,
    { next: { revalidate: 300 } }
  )

  if (!response.ok) {
    throw new Error(`Polygon search failed with HTTP ${response.status}`)
  }

  const payload = await response.json() as {
    results?: Array<{ ticker?: string; name?: string; primary_exchange?: string }>
  }

  if (!Array.isArray(payload.results)) return []

  return payload.results
    .filter((result) => typeof result.ticker === 'string')
    .map((result) => ({
      symbol: result.ticker as string,
      name: result.name ?? (result.ticker as string),
      exchange: result.primary_exchange ?? '',
    }))
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const upper = symbol.toUpperCase()
  return cacheWrapper(`quote:${upper}`, CACHE_TTL.STOCK_QUOTE, async () => {
    try {
      const polygonQuote = await fetchPolygonQuote(upper)
      if (polygonQuote) return polygonQuote

      const raw = await fetchYahooRawQuote(upper)
      return normalizeQuote(raw)
    } catch (err) {
      throw new YahooFinanceError(`Failed to fetch quote for ${upper}`, upper, err)
    }
  })
}

export interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getHistoricalData(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1mo'
): Promise<ChartPoint[]> {
  const upper = symbol.toUpperCase()
  return cacheWrapper(`hist:${upper}:${period}`, CACHE_TTL.HISTORICAL, async () => {
    try {
      const polygonHistory = await fetchPolygonHistory(upper, period)
      if (polygonHistory && polygonHistory.length > 0) return polygonHistory

      const result = await withRetry(() =>
        yahooFinance.historical(upper, {
          period1: getStartDate(period),
          period2: new Date(),
        })
      ) as Array<{ date: Date | string; open?: number; high?: number; low?: number; close?: number; volume?: number }>
      return result.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
        open: row.open ?? 0,
        high: row.high ?? 0,
        low: row.low ?? 0,
        close: row.close ?? 0,
        volume: row.volume ?? 0,
      }))
    } catch (err) {
      throw new YahooFinanceError(`Failed to fetch history for ${upper}`, upper, err)
    }
  })
}

export async function searchSymbols(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
  return cacheWrapper(`search:${query.toLowerCase()}`, CACHE_TTL.SEARCH, async () => {
    try {
      const polygonResults = await fetchPolygonSymbolSearch(query)
      if (polygonResults && polygonResults.length > 0) return polygonResults

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = await withRetry(() => yahooFinance.search(query)) as Record<string, any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((results.quotes ?? []) as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any): q is any => typeof q.symbol === 'string')
        .slice(0, 10)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((q: any) => ({
          symbol: q.symbol,
          name: ('shortname' in q ? q.shortname : null) ?? ('longname' in q ? q.longname : null) ?? q.symbol,
          exchange: ('exchange' in q ? q.exchange : null) ?? '',
        }))
    } catch (err) {
      throw new YahooFinanceError(`Search failed for "${query}"`, query, err)
    }
  })
}

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case '1mo': return new Date(new Date(now).setMonth(now.getMonth() - 1))
    case '3mo': return new Date(new Date(now).setMonth(now.getMonth() - 3))
    case '6mo': return new Date(new Date(now).setMonth(now.getMonth() - 6))
    case '1y': return new Date(new Date(now).setFullYear(now.getFullYear() - 1))
    case '2y': return new Date(new Date(now).setFullYear(now.getFullYear() - 2))
    case '5y': return new Date(new Date(now).setFullYear(now.getFullYear() - 5))
    default: return new Date(new Date(now).setMonth(now.getMonth() - 1))
  }
}
