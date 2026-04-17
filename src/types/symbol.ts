export type MarketStatus = 'open' | 'closed' | 'pre' | 'after'
export type AssetType = 'stock' | 'etf' | 'crypto' | 'index' | 'forex' | 'futures' | 'bond'
export type Signal = 'buy' | 'sell' | 'neutral'
export type OverallSignal = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell'
export type Sentiment = 'positive' | 'negative' | 'neutral'

export interface SymbolQuote {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  prevClose: number
  volume: number
  avgVolume: number
  marketCap: number
  marketStatus: MarketStatus
  currency: string
  type: AssetType
}

export interface SymbolFundamentals {
  pe: number | null
  forwardPe: number | null
  eps: number | null
  revenue: number | null
  netIncome: number | null
  dividendYield: number | null
  beta: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  sharesOutstanding: number | null
  float: number | null
  sector: string | null
  industry: string | null
  ceo: string | null
  hq: string | null
  founded: string | null
  description: string | null
  employees: number | null
  website: string | null
}

export interface SymbolPerformance {
  d1: number
  d5: number
  m1: number
  m3: number
  m6: number
  ytd: number
  y1: number
  y5: number
}

export interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  summary: string
  sentiment: Sentiment
  url: string
  aiInsight: string
}

export interface TechnicalSignal {
  name: string
  value: string
  signal: Signal
}

export interface TechnicalSummary {
  overallScore: number
  overallSignal: OverallSignal
  movingAverages: TechnicalSignal[]
  oscillators: TechnicalSignal[]
  support: number[]
  resistance: number[]
  trendSummary: string
  maBuyCount: number
  maSellCount: number
  maNeutralCount: number
  oscBuyCount: number
  oscSellCount: number
  oscNeutralCount: number
}

export interface AnalystForecast {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  avgTarget: number
  highTarget: number
  lowTarget: number
  consensus: OverallSignal
  scenarios: {
    bull: { target: number; rationale: string }
    base: { target: number; rationale: string }
    bear: { target: number; rationale: string }
  }
}

export interface RelatedAsset {
  symbol: string
  name: string
  price: number
  changePercent: number
  marketCap: number
  correlation: number
  inWatchlist: boolean
}

export interface AIInsight {
  headline: string
  whatChanged: string
  whyMoving: string
  riskSnapshot: string
  keyTakeaway: string
  confidence: 'high' | 'medium' | 'low'
  updatedAt: string
}

export interface SymbolData {
  quote: SymbolQuote
  fundamentals: SymbolFundamentals
  performance: SymbolPerformance
  news: NewsItem[]
  technicals: TechnicalSummary
  forecast: AnalystForecast
  related: RelatedAsset[]
  aiInsight: AIInsight
}
