import type { SymbolData, SymbolQuote, SymbolFundamentals, SymbolPerformance, NewsItem, TechnicalSummary, AnalystForecast, RelatedAsset, AIInsight } from '@/types/symbol'
import type { ChartPoint } from '@/types'

const MOCK_NOW = Date.parse('2026-04-17T12:00:00.000Z')

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1
  return () => {
    state = Math.imul(state, 1664525) + 1013904223
    return ((state >>> 0) / 4294967296)
  }
}

// Generate realistic mock OHLCV chart data
function generateChartData(basePrice: number, days: number, seedKey = 'default'): ChartPoint[] {
  const data: ChartPoint[] = []
  let price = basePrice * 0.82
  const now = MOCK_NOW
  const random = createSeededRandom(hashString(seedKey))

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const change = (random() - 0.48) * price * 0.025
    const open = price
    price = Math.max(price + change, 1)
    const high = Math.max(open, price) * (1 + random() * 0.008)
    const low = Math.min(open, price) * (1 - random() * 0.008)
    const volume = Math.floor(20_000_000 + random() * 60_000_000)

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    })
  }
  return data
}

const AAPL_QUOTE: SymbolQuote = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  price: 189.30,
  change: 2.45,
  changePercent: 1.31,
  open: 187.20,
  high: 190.15,
  low: 186.85,
  prevClose: 186.85,
  volume: 54_823_100,
  avgVolume: 58_400_000,
  marketCap: 2_940_000_000_000,
  marketStatus: 'closed',
  currency: 'USD',
  type: 'stock',
}

const AAPL_FUNDAMENTALS: SymbolFundamentals = {
  pe: 29.4,
  forwardPe: 27.1,
  eps: 6.44,
  revenue: 383_285_000_000,
  netIncome: 96_995_000_000,
  dividendYield: 0.52,
  beta: 1.24,
  fiftyTwoWeekHigh: 199.62,
  fiftyTwoWeekLow: 164.08,
  sharesOutstanding: 15_550_000_000,
  float: 15_450_000_000,
  sector: 'Technology',
  industry: 'Consumer Electronics',
  ceo: 'Tim Cook',
  hq: 'Cupertino, CA',
  founded: '1976',
  description: `Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, Apple Watch, AirPods, and services including the App Store, Apple Music, iCloud, Apple Pay, and Apple TV+. Apple's vertically integrated model — controlling hardware, software, and services — creates one of the most powerful consumer ecosystems in technology. With over 2 billion active devices and a growing services segment now exceeding $85B annually, Apple has transformed from a hardware company into a platform business with exceptional recurring revenue and margins.`,
  employees: 164_000,
  website: 'https://apple.com',
}

const AAPL_PERFORMANCE: SymbolPerformance = {
  d1: 1.31,
  d5: -0.84,
  m1: 3.22,
  m3: -5.41,
  m6: 8.77,
  ytd: 12.44,
  y1: 18.92,
  y5: 312.5,
}

const AAPL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Apple Intelligence Features Driving iPhone 16 Upgrade Cycle, Analysts Say',
    source: 'Bloomberg',
    publishedAt: new Date(MOCK_NOW - 2 * 60 * 60 * 1000).toISOString(),
    summary: 'Wall Street analysts are increasingly bullish on Apple\'s AI-driven upgrade cycle, with multiple firms raising price targets ahead of the next earnings report.',
    sentiment: 'positive',
    url: '#',
    aiInsight: 'AI feature adoption could accelerate the replacement cycle for the ~350M iPhones that haven\'t been upgraded in 4+ years — a structural tailwind for Services attach rates.',
  },
  {
    id: '2',
    title: 'Apple Faces EU Antitrust Investigation Over App Store Practices',
    source: 'Reuters',
    publishedAt: new Date(MOCK_NOW - 6 * 60 * 60 * 1000).toISOString(),
    summary: 'European regulators opened a formal investigation into Apple\'s compliance with the Digital Markets Act, focusing on App Store fee structures and third-party app access.',
    sentiment: 'negative',
    url: '#',
    aiInsight: 'EU DMA non-compliance fines could reach 10% of global annual turnover (~$38B). Historically, regulatory overhangs create short-term volatility but rarely impair long-term fundamentals.',
  },
  {
    id: '3',
    title: 'Apple\'s Services Revenue Hits Record $24.2B, Beating Estimates',
    source: 'CNBC',
    publishedAt: new Date(MOCK_NOW - 18 * 60 * 60 * 1000).toISOString(),
    summary: 'Apple\'s services segment posted another record quarter, driven by App Store, Apple TV+, and iCloud subscriptions growing faster than expected.',
    sentiment: 'positive',
    url: '#',
    aiInsight: 'Services now represent ~26% of revenue but ~40% of gross profit. Each services dollar is worth more than hardware at ~72% gross margin — the mix shift is compounding.',
  },
  {
    id: '4',
    title: 'Supply Chain Diversification: Apple Expands India Manufacturing',
    source: 'Financial Times',
    publishedAt: new Date(MOCK_NOW - 30 * 60 * 60 * 1000).toISOString(),
    summary: 'Apple has accelerated its manufacturing footprint in India, with Foxconn and Tata producing 14% of global iPhone units outside China — up from 7% last year.',
    sentiment: 'neutral',
    url: '#',
    aiInsight: 'Geopolitical de-risking reduces tail-risk exposure to US-China trade tensions. Investors who priced in a "China shock" discount may need to revisit their bear cases.',
  },
]

const AAPL_TECHNICALS: TechnicalSummary = {
  overallScore: 42,
  overallSignal: 'buy',
  maBuyCount: 9,
  maSellCount: 2,
  maNeutralCount: 1,
  oscBuyCount: 3,
  oscSellCount: 2,
  oscNeutralCount: 6,
  movingAverages: [
    { name: 'EMA 10', value: '187.44', signal: 'buy' },
    { name: 'SMA 20', value: '185.90', signal: 'buy' },
    { name: 'EMA 50', value: '182.31', signal: 'buy' },
    { name: 'SMA 100', value: '178.55', signal: 'buy' },
    { name: 'SMA 200', value: '172.18', signal: 'buy' },
    { name: 'VWAP', value: '188.02', signal: 'neutral' },
    { name: 'Hull MA', value: '188.91', signal: 'buy' },
  ],
  oscillators: [
    { name: 'RSI (14)', value: '58.2', signal: 'neutral' },
    { name: 'MACD', value: '1.84', signal: 'buy' },
    { name: 'Stochastic', value: '72.4', signal: 'neutral' },
    { name: 'CCI (20)', value: '84.1', signal: 'neutral' },
    { name: 'ADX', value: '24.3', signal: 'neutral' },
    { name: 'Momentum', value: '4.22', signal: 'buy' },
    { name: 'Williams %R', value: '-28.1', signal: 'neutral' },
  ],
  support: [185.50, 182.00, 178.30],
  resistance: [191.00, 195.50, 199.62],
  trendSummary: 'AAPL is in a short-term uptrend above all major moving averages. Price action has been constructive since the January low, with higher lows forming on the daily chart. RSI is healthy at 58 — not overbought, leaving room for continuation. Watch the $191 resistance zone, which has capped multiple rally attempts over the past three months.',
}

const AAPL_FORECAST: AnalystForecast = {
  strongBuy: 18,
  buy: 14,
  hold: 8,
  sell: 2,
  strongSell: 1,
  avgTarget: 201.50,
  highTarget: 240.00,
  lowTarget: 158.00,
  consensus: 'buy',
  scenarios: {
    bull: {
      target: 235,
      rationale: 'AI-driven iPhone upgrade supercycle materializes, Services hits 30% revenue mix, India supply chain eliminates geopolitical discount. Multiple expansion to 35x earnings.',
    },
    base: {
      target: 205,
      rationale: 'Steady mid-single-digit revenue growth, Services compound at 12% annually, buybacks reduce share count by ~3% per year. Fair value at 28-30x forward earnings.',
    },
    bear: {
      target: 155,
      rationale: 'EU/US regulatory actions materially impair App Store economics, China macro weakens iPhone demand, AI features fail to drive upgrade cycle. Multiple compression to 22x.',
    },
  },
}

const AAPL_RELATED: RelatedAsset[] = [
  { symbol: 'MSFT', name: 'Microsoft', price: 415.20, changePercent: 0.84, marketCap: 3_080_000_000_000, correlation: 0.78, inWatchlist: false },
  { symbol: 'GOOGL', name: 'Alphabet', price: 175.42, changePercent: -0.38, marketCap: 2_180_000_000_000, correlation: 0.71, inWatchlist: true },
  { symbol: 'META', name: 'Meta Platforms', price: 521.10, changePercent: 1.52, marketCap: 1_320_000_000_000, correlation: 0.65, inWatchlist: false },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.40, changePercent: 3.67, marketCap: 2_160_000_000_000, correlation: 0.61, inWatchlist: true },
  { symbol: 'AMZN', name: 'Amazon', price: 185.15, changePercent: -0.72, marketCap: 1_930_000_000_000, correlation: 0.69, inWatchlist: false },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', price: 447.60, changePercent: 1.22, marketCap: 0, correlation: 0.92, inWatchlist: false },
]

const AAPL_AI_INSIGHT: AIInsight = {
  headline: 'Apple is quietly becoming an AI platform company — the market hasn\'t fully priced it in.',
  whatChanged: 'Apple Intelligence features shipped to 85% of iPhone 15/16 users this week following the iOS 18.3 update. Early engagement data shows Siri query volume up 3.4x week-over-week.',
  whyMoving: 'The stock is up 1.3% today on a combination of analyst upgrades following the Siri engagement data and a broader rotation into mega-cap tech after softer-than-expected inflation data.',
  riskSnapshot: 'Primary risks: (1) EU DMA compliance cost overhang, (2) China iPhone demand softness, (3) AI feature monetization unproven at scale. Options market implies ±4.2% move on next earnings.',
  keyTakeaway: 'For retail investors: Apple is rarely cheap, but at 27x forward earnings with the AI upgrade cycle just beginning, the risk/reward looks more compelling than 12 months ago. The Services mix shift is a structural story, not a quarter-to-quarter trade.',
  confidence: 'medium',
  updatedAt: new Date(MOCK_NOW - 45 * 60 * 1000).toISOString(),
}

// Per-symbol data registry
const SYMBOL_REGISTRY: Record<string, SymbolData> = {
  AAPL: {
    quote: AAPL_QUOTE,
    fundamentals: AAPL_FUNDAMENTALS,
    performance: AAPL_PERFORMANCE,
    news: AAPL_NEWS,
    technicals: AAPL_TECHNICALS,
    forecast: AAPL_FORECAST,
    related: AAPL_RELATED,
    aiInsight: AAPL_AI_INSIGHT,
  },
}

function buildGenericData(symbol: string): SymbolData {
  const normalizedSymbol = symbol.toUpperCase()
  const random = createSeededRandom(hashString(`symbol:${normalizedSymbol}`))
  const price = 100 + random() * 400
  const change = (random() - 0.5) * price * 0.04
  return {
    quote: {
      symbol: normalizedSymbol,
      name: `${normalizedSymbol} Inc.`,
      exchange: 'NASDAQ',
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / price) * 100).toFixed(2)),
      open: parseFloat((price - change * 0.3).toFixed(2)),
      high: parseFloat((price * 1.012).toFixed(2)),
      low: parseFloat((price * 0.988).toFixed(2)),
      prevClose: parseFloat((price - change).toFixed(2)),
      volume: Math.floor(10_000_000 + random() * 40_000_000),
      avgVolume: Math.floor(15_000_000 + random() * 30_000_000),
      marketCap: Math.floor(price * 1_000_000_000),
      marketStatus: 'closed',
      currency: 'USD',
      type: 'stock',
    },
    fundamentals: {
      pe: parseFloat((15 + random() * 25).toFixed(1)),
      forwardPe: parseFloat((13 + random() * 20).toFixed(1)),
      eps: parseFloat((2 + random() * 8).toFixed(2)),
      revenue: Math.floor(10_000_000_000 + random() * 90_000_000_000),
      netIncome: Math.floor(1_000_000_000 + random() * 20_000_000_000),
      dividendYield: random() > 0.5 ? parseFloat((random() * 3).toFixed(2)) : null,
      beta: parseFloat((0.8 + random() * 1.2).toFixed(2)),
      fiftyTwoWeekHigh: parseFloat((price * 1.35).toFixed(2)),
      fiftyTwoWeekLow: parseFloat((price * 0.72).toFixed(2)),
      sharesOutstanding: Math.floor(500_000_000 + random() * 5_000_000_000),
      float: null,
      sector: 'Technology',
      industry: 'Software',
      ceo: 'John Smith',
      hq: 'San Francisco, CA',
      founded: '2005',
      description: `${normalizedSymbol} is a leading technology company focused on delivering innovative products and services to consumers and enterprises worldwide.`,
      employees: Math.floor(10_000 + random() * 100_000),
      website: `https://${normalizedSymbol.toLowerCase()}.com`,
    },
    performance: {
      d1: parseFloat(((random() - 0.5) * 6).toFixed(2)),
      d5: parseFloat(((random() - 0.5) * 10).toFixed(2)),
      m1: parseFloat(((random() - 0.5) * 15).toFixed(2)),
      m3: parseFloat(((random() - 0.5) * 25).toFixed(2)),
      m6: parseFloat(((random() - 0.5) * 40).toFixed(2)),
      ytd: parseFloat(((random() - 0.5) * 50).toFixed(2)),
      y1: parseFloat(((random() - 0.5) * 80).toFixed(2)),
      y5: parseFloat(((random() - 0.3) * 200).toFixed(2)),
    },
    news: AAPL_NEWS,
    technicals: AAPL_TECHNICALS,
    forecast: AAPL_FORECAST,
    related: AAPL_RELATED,
    aiInsight: AAPL_AI_INSIGHT,
  }
}
export function getMockSymbolData(symbol: string): SymbolData {
  return SYMBOL_REGISTRY[symbol.toUpperCase()] ?? buildGenericData(symbol.toUpperCase())
}

export function getMockChartData(symbol: string, days = 180): ChartPoint[] {
  const base = SYMBOL_REGISTRY[symbol.toUpperCase()]?.quote.price ?? 150
  return generateChartData(base, days, symbol.toUpperCase())
}
