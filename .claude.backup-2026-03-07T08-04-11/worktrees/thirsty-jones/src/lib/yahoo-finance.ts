import yahooFinance from 'yahoo-finance2'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YahooQuote = Record<string, any>

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const quote = await yahooFinance.quote(symbol) as YahooQuote
  return {
    symbol: quote.symbol,
    shortName: quote.shortName || null,
    regularMarketPrice: quote.regularMarketPrice || 0,
    regularMarketChange: quote.regularMarketChange || 0,
    regularMarketChangePercent: quote.regularMarketChangePercent || 0,
    regularMarketVolume: quote.regularMarketVolume || 0,
    marketCap: quote.marketCap || null,
    trailingPE: quote.trailingPE || null,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
    regularMarketDayHigh: quote.regularMarketDayHigh || 0,
    regularMarketDayLow: quote.regularMarketDayLow || 0,
    currency: quote.currency || 'USD',
  }
}

export async function getHistoricalData(
  symbol: string,
  period: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1mo'
) {
  const result = await yahooFinance.historical(symbol, {
    period1: getStartDate(period),
    period2: new Date(),
  })
  return result
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
