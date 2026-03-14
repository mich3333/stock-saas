import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getHistoricalData, getStockQuote } from '@/lib/yahoo-finance'

export interface HeatmapStock {
  symbol: string
  name: string
  price: number
  changePercent: number
  marketCap: number
  sector: string
  volume: number
}

export interface HeatmapSector {
  name: string
  stocks: HeatmapStock[]
  totalMarketCap: number
  avgChangePercent: number
}

const SECTOR_STOCKS: Array<{
  symbol: string
  name: string
  sector: string
  basePrice: number
  change1D: number
  marketCap: number
  volume: number
}> = [
  // Technology
  { symbol: 'AAPL',   name: 'Apple',          sector: 'Technology',    basePrice: 189.84,  change1D:  1.14, marketCap: 2_940_000_000_000, volume: 58_432_100 },
  { symbol: 'MSFT',   name: 'Microsoft',       sector: 'Technology',    basePrice: 418.52,  change1D: -0.29, marketCap: 3_110_000_000_000, volume: 21_345_600 },
  { symbol: 'NVDA',   name: 'NVIDIA',          sector: 'Technology',    basePrice: 875.39,  change1D:  2.59, marketCap: 2_160_000_000_000, volume: 52_134_700 },
  { symbol: 'META',   name: 'Meta',            sector: 'Technology',    basePrice: 524.77,  change1D: -0.82, marketCap: 1_340_000_000_000, volume: 15_234_500 },
  { symbol: 'AVGO',   name: 'Broadcom',        sector: 'Technology',    basePrice: 1342.87, change1D:  2.17, marketCap:   621_000_000_000, volume:  3_987_600 },
  { symbol: 'ADBE',   name: 'Adobe',           sector: 'Technology',    basePrice: 471.23,  change1D: -1.14, marketCap:   209_000_000_000, volume:  3_456_700 },
  { symbol: 'CRM',    name: 'Salesforce',      sector: 'Technology',    basePrice: 295.18,  change1D:  1.33, marketCap:   285_000_000_000, volume:  5_678_900 },
  { symbol: 'AMD',    name: 'AMD',             sector: 'Technology',    basePrice: 168.47,  change1D:  2.58, marketCap:   273_000_000_000, volume: 42_345_600 },
  { symbol: 'INTC',   name: 'Intel',           sector: 'Technology',    basePrice: 29.47,   change1D: -1.80, marketCap:   125_000_000_000, volume: 38_912_300 },
  { symbol: 'ORCL',   name: 'Oracle',          sector: 'Technology',    basePrice: 124.87,  change1D:  1.74, marketCap:   342_000_000_000, volume:  8_765_400 },
  { symbol: 'QCOM',   name: 'Qualcomm',        sector: 'Technology',    basePrice: 172.48,  change1D:  1.90, marketCap:   193_000_000_000, volume:  9_876_500 },
  { symbol: 'NOW',    name: 'ServiceNow',      sector: 'Technology',    basePrice: 812.34,  change1D:  2.33, marketCap:   167_000_000_000, volume:  1_234_500 },
  { symbol: 'ASML',   name: 'ASML',            sector: 'Technology',    basePrice: 892.40,  change1D:  2.09, marketCap:   352_000_000_000, volume:    876_500 },

  // Healthcare
  { symbol: 'LLY',    name: 'Eli Lilly',       sector: 'Healthcare',    basePrice: 812.54,  change1D:  1.92, marketCap:   770_000_000_000, volume:  4_123_400 },
  { symbol: 'UNH',    name: 'UnitedHealth',    sector: 'Healthcare',    basePrice: 524.81,  change1D:  0.62, marketCap:   484_000_000_000, volume:  3_987_600 },
  { symbol: 'JNJ',    name: 'J&J',             sector: 'Healthcare',    basePrice: 152.43,  change1D:  0.21, marketCap:   365_000_000_000, volume:  8_123_400 },
  { symbol: 'MRK',    name: 'Merck',           sector: 'Healthcare',    basePrice: 128.47,  change1D:  0.97, marketCap:   326_000_000_000, volume: 10_234_500 },
  { symbol: 'ABBV',   name: 'AbbVie',          sector: 'Healthcare',    basePrice: 179.84,  change1D:  1.36, marketCap:   318_000_000_000, volume:  7_654_300 },
  { symbol: 'NVO',    name: 'Novo Nordisk',    sector: 'Healthcare',    basePrice: 104.80,  change1D: -1.13, marketCap:   473_000_000_000, volume:  6_789_000 },
  { symbol: 'AZN',    name: 'AstraZeneca',     sector: 'Healthcare',    basePrice: 74.80,   change1D:  1.22, marketCap:   236_000_000_000, volume:  5_678_900 },
  { symbol: 'PFE',    name: 'Pfizer',          sector: 'Healthcare',    basePrice: 27.43,   change1D: -0.72, marketCap:   155_000_000_000, volume: 28_432_100 },

  // Finance
  { symbol: 'BRK.B',  name: 'Berkshire',       sector: 'Finance',       basePrice: 411.29,  change1D:  0.21, marketCap:   897_000_000_000, volume:  3_456_700 },
  { symbol: 'JPM',    name: 'JPMorgan',        sector: 'Finance',       basePrice: 208.47,  change1D:  0.74, marketCap:   597_000_000_000, volume: 12_345_600 },
  { symbol: 'V',      name: 'Visa',            sector: 'Finance',       basePrice: 279.13,  change1D: -0.23, marketCap:   567_000_000_000, volume:  7_654_300 },
  { symbol: 'MA',     name: 'Mastercard',      sector: 'Finance',       basePrice: 472.88,  change1D:  0.45, marketCap:   436_000_000_000, volume:  3_234_500 },
  { symbol: 'BAC',    name: 'Bank of America', sector: 'Finance',       basePrice: 37.84,   change1D:  1.09, marketCap:   296_000_000_000, volume: 45_678_900 },
  { symbol: 'GS',     name: 'Goldman Sachs',   sector: 'Finance',       basePrice: 482.10,  change1D:  0.87, marketCap:   157_000_000_000, volume:  2_456_700 },
  { symbol: 'WFC',    name: 'Wells Fargo',     sector: 'Finance',       basePrice: 56.43,   change1D: -0.54, marketCap:   205_000_000_000, volume: 18_765_400 },

  // Consumer
  { symbol: 'AMZN',   name: 'Amazon',          sector: 'Consumer',      basePrice: 204.39,  change1D:  0.92, marketCap: 2_150_000_000_000, volume: 38_921_400 },
  { symbol: 'TSLA',   name: 'Tesla',           sector: 'Consumer',      basePrice: 248.61,  change1D: -3.28, marketCap:   793_000_000_000, volume: 98_432_100 },
  { symbol: 'WMT',    name: 'Walmart',         sector: 'Consumer',      basePrice: 68.43,   change1D:  0.47, marketCap:   549_000_000_000, volume: 15_234_500 },
  { symbol: 'HD',     name: 'Home Depot',      sector: 'Consumer',      basePrice: 371.54,  change1D:  1.12, marketCap:   370_000_000_000, volume:  4_321_000 },
  { symbol: 'COST',   name: 'Costco',          sector: 'Consumer',      basePrice: 798.14,  change1D:  1.57, marketCap:   354_000_000_000, volume:  2_345_600 },
  { symbol: 'PG',     name: "P&G",             sector: 'Consumer',      basePrice: 163.22,  change1D: -0.33, marketCap:   384_000_000_000, volume:  6_543_200 },
  { symbol: 'KO',     name: 'Coca-Cola',       sector: 'Consumer',      basePrice: 62.47,   change1D: -0.37, marketCap:   269_000_000_000, volume: 14_321_000 },
  { symbol: 'PEP',    name: 'PepsiCo',         sector: 'Consumer',      basePrice: 167.83,  change1D:  0.27, marketCap:   230_000_000_000, volume:  5_432_100 },
  { symbol: 'LVMUY',  name: 'LVMH',            sector: 'Consumer',      basePrice: 141.80,  change1D:  1.50, marketCap:   357_000_000_000, volume:    876_500 },

  // Energy
  { symbol: 'XOM',    name: 'ExxonMobil',      sector: 'Energy',        basePrice: 118.74,  change1D: -0.93, marketCap:   479_000_000_000, volume: 18_432_100 },
  { symbol: 'CVX',    name: 'Chevron',         sector: 'Energy',        basePrice: 154.23,  change1D: -0.56, marketCap:   285_000_000_000, volume:  9_876_500 },
  { symbol: 'SHEL',   name: 'Shell',           sector: 'Energy',        basePrice: 64.20,   change1D: -1.23, marketCap:   212_000_000_000, volume:  8_765_400 },
  { symbol: 'TTE',    name: 'TotalEnergies',   sector: 'Energy',        basePrice: 64.90,   change1D: -1.07, marketCap:   148_000_000_000, volume:  4_567_800 },
  { symbol: 'COP',    name: 'ConocoPhillips',  sector: 'Energy',        basePrice: 119.47,  change1D: -0.82, marketCap:   152_000_000_000, volume:  6_789_000 },

  // Communication
  { symbol: 'GOOGL',  name: 'Alphabet',        sector: 'Communication', basePrice: 175.98,  change1D:  1.98, marketCap: 2_190_000_000_000, volume: 24_678_900 },
  { symbol: 'NFLX',   name: 'Netflix',         sector: 'Communication', basePrice: 648.92,  change1D:  1.36, marketCap:   281_000_000_000, volume:  4_567_800 },
  { symbol: 'DIS',    name: 'Disney',          sector: 'Communication', basePrice: 113.47,  change1D: -1.07, marketCap:   207_000_000_000, volume: 11_234_500 },
  { symbol: 'CMCSA',  name: 'Comcast',         sector: 'Communication', basePrice: 41.23,   change1D:  0.34, marketCap:   169_000_000_000, volume: 22_345_600 },
  { symbol: 'T',      name: 'AT&T',            sector: 'Communication', basePrice: 19.87,   change1D: -0.45, marketCap:   142_000_000_000, volume: 35_678_900 },
  { symbol: 'VZ',     name: 'Verizon',         sector: 'Communication', basePrice: 41.54,   change1D:  0.17, marketCap:   174_000_000_000, volume: 15_432_100 },
  { symbol: 'SPOT',   name: 'Spotify',         sector: 'Communication', basePrice: 382.60,  change1D:  2.52, marketCap:    74_000_000_000, volume:  2_134_500 },

  // Industrials
  { symbol: 'RTX',    name: 'Raytheon',        sector: 'Industrials',   basePrice: 100.87,  change1D:  0.64, marketCap:   136_000_000_000, volume:  8_234_500 },
  { symbol: 'HON',    name: 'Honeywell',       sector: 'Industrials',   basePrice: 202.34,  change1D:  0.31, marketCap:   132_000_000_000, volume:  3_456_700 },
  { symbol: 'UPS',    name: 'UPS',             sector: 'Industrials',   basePrice: 148.92,  change1D: -0.87, marketCap:   127_000_000_000, volume:  4_567_800 },
  { symbol: 'CAT',    name: 'Caterpillar',     sector: 'Industrials',   basePrice: 362.47,  change1D:  1.24, marketCap:   181_000_000_000, volume:  2_345_600 },
  { symbol: 'BA',     name: 'Boeing',          sector: 'Industrials',   basePrice: 191.34,  change1D: -1.42, marketCap:   118_000_000_000, volume:  9_876_500 },
  { symbol: 'GE',     name: 'GE Aerospace',    sector: 'Industrials',   basePrice: 162.87,  change1D:  1.78, marketCap:   178_000_000_000, volume:  7_654_300 },
  { symbol: 'SIEGY',  name: 'Siemens',         sector: 'Industrials',   basePrice: 96.30,   change1D:  1.47, marketCap:   153_000_000_000, volume:  1_876_500 },

  // Materials
  { symbol: 'LIN',    name: 'Linde',           sector: 'Materials',     basePrice: 453.87,  change1D:  0.54, marketCap:   217_000_000_000, volume:  2_134_500 },
  { symbol: 'APD',    name: 'Air Products',    sector: 'Materials',     basePrice: 278.43,  change1D: -0.23, marketCap:    62_000_000_000, volume:  1_234_500 },
  { symbol: 'SHW',    name: 'Sherwin-Williams',sector: 'Materials',     basePrice: 347.12,  change1D:  0.89, marketCap:    89_000_000_000, volume:  1_876_500 },
  { symbol: 'FCX',    name: 'Freeport-McMoRan',sector: 'Materials',     basePrice: 42.87,   change1D:  1.34, marketCap:    62_000_000_000, volume: 15_432_100 },
  { symbol: 'NEM',    name: 'Newmont',         sector: 'Materials',     basePrice: 48.23,   change1D:  2.14, marketCap:    49_000_000_000, volume:  8_765_400 },

  // Utilities
  { symbol: 'NEE',    name: 'NextEra Energy',  sector: 'Utilities',     basePrice: 63.47,   change1D:  0.43, marketCap:   129_000_000_000, volume: 10_234_500 },
  { symbol: 'DUK',    name: 'Duke Energy',     sector: 'Utilities',     basePrice: 101.23,  change1D: -0.21, marketCap:    78_000_000_000, volume:  4_567_800 },
  { symbol: 'SO',     name: 'Southern Co',     sector: 'Utilities',     basePrice: 71.87,   change1D:  0.34, marketCap:    74_000_000_000, volume:  5_678_900 },
  { symbol: 'D',      name: 'Dominion Energy', sector: 'Utilities',     basePrice: 51.43,   change1D: -0.54, marketCap:    43_000_000_000, volume:  7_654_300 },

  // Real Estate
  { symbol: 'AMT',    name: 'American Tower',  sector: 'Real Estate',   basePrice: 212.87,  change1D:  0.78, marketCap:    98_000_000_000, volume:  2_345_600 },
  { symbol: 'PLD',    name: 'Prologis',        sector: 'Real Estate',   basePrice: 123.47,  change1D: -0.43, marketCap:   117_000_000_000, volume:  4_321_000 },
  { symbol: 'EQIX',   name: 'Equinix',         sector: 'Real Estate',   basePrice: 874.23,  change1D:  1.12, marketCap:    79_000_000_000, volume:    987_600 },
  { symbol: 'CCI',    name: 'Crown Castle',    sector: 'Real Estate',   basePrice: 102.47,  change1D: -0.87, marketCap:    44_000_000_000, volume:  3_456_700 },
  { symbol: 'SPG',    name: 'Simon Property',  sector: 'Real Estate',   basePrice: 162.34,  change1D:  0.54, marketCap:    53_000_000_000, volume:  2_234_500 },
]

const TIMEFRAME_TO_PERIOD: Record<string, '1mo' | '3mo' | '6mo'> = {
  '1D': '1mo',
  '1W': '1mo',
  '1M': '3mo',
  '3M': '6mo',
}

let cache: { data: unknown; ts: number; timeframe: string } | null = null
const CACHE_TTL = 60_000

const VALID_TIMEFRAMES = new Set(Object.keys(TIMEFRAME_TO_PERIOD))

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const { searchParams } = new URL(request.url)
  const timeframeParam = searchParams.get('timeframe') ?? '1D'
  const timeframe = VALID_TIMEFRAMES.has(timeframeParam) ? timeframeParam : '1D'

  if (cache && cache.timeframe === timeframe && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    const quoteEntries = await Promise.all(
      SECTOR_STOCKS.map(async (stock) => {
        try {
          const quote = await getStockQuote(stock.symbol)
          return [stock.symbol, quote] as const
        } catch {
          return null
        }
      })
    )
    const quoteMap = new Map(quoteEntries.filter((entry): entry is readonly [string, Awaited<ReturnType<typeof getStockQuote>>] => Boolean(entry)))

    const changeMap = new Map<string, number>()

    if (timeframe === '1D') {
      for (const stock of SECTOR_STOCKS) {
        const quote = quoteMap.get(stock.symbol)
        changeMap.set(stock.symbol, Number(quote?.regularMarketChangePercent ?? 0))
      }
    } else {
      const period = TIMEFRAME_TO_PERIOD[timeframe]
      const historyEntries = await Promise.all(
        SECTOR_STOCKS.map(async (stock) => {
          try {
            const history = await getHistoricalData(stock.symbol, period)
            if (history.length < 2) return [stock.symbol, Number(quoteMap.get(stock.symbol)?.regularMarketChangePercent ?? 0)] as const

            const relevantHistory = timeframe === '1W' ? history.slice(-7) : history
            const first = relevantHistory[0]?.close ?? history[0]?.close ?? 0
            const last = relevantHistory[relevantHistory.length - 1]?.close ?? first
            const changePercent = first > 0 ? ((last - first) / first) * 100 : 0
            return [stock.symbol, Number(changePercent.toFixed(2))] as const
          } catch {
            return [stock.symbol, Number(quoteMap.get(stock.symbol)?.regularMarketChangePercent ?? 0)] as const
          }
        })
      )

      for (const [symbol, changePercent] of historyEntries) {
        changeMap.set(symbol, changePercent)
      }
    }

    const stocks: HeatmapStock[] = SECTOR_STOCKS
      .filter((stock) => quoteMap.has(stock.symbol))
      .map((stock) => {
      const quote = quoteMap.get(stock.symbol)

      return {
        symbol: stock.symbol,
        name: stock.name,
        price: Number(quote?.regularMarketPrice ?? stock.basePrice),
        changePercent: changeMap.get(stock.symbol) ?? 0,
        marketCap: Number(quote?.marketCap ?? stock.marketCap),
        sector: stock.sector,
        volume: Number(quote?.regularMarketVolume ?? stock.volume),
      }
    })

    if (stocks.length === 0) {
      return NextResponse.json({ error: 'Live heatmap data is temporarily unavailable' }, { status: 502 })
    }

    const sectorMap: Record<string, HeatmapStock[]> = {}
    for (const stock of stocks) {
      if (!sectorMap[stock.sector]) sectorMap[stock.sector] = []
      sectorMap[stock.sector].push(stock)
    }

    const sectors: HeatmapSector[] = Object.entries(sectorMap).map(([name, sectorStocks]) => {
      const totalMarketCap = sectorStocks.reduce((acc, stock) => acc + stock.marketCap, 0)
      const avgChangePercent = +(sectorStocks.reduce((acc, stock) => acc + stock.changePercent, 0) / sectorStocks.length).toFixed(2)
      return { name, stocks: sectorStocks, totalMarketCap, avgChangePercent }
    })

    sectors.sort((a, b) => b.totalMarketCap - a.totalMarketCap)
    const data = { sectors, timeframe, updatedAt: new Date().toISOString() }
    cache = { data, ts: Date.now(), timeframe }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Live heatmap data is temporarily unavailable' }, { status: 502 })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
