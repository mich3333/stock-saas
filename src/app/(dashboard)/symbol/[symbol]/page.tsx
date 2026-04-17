'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { StockChart } from '@/components/charts/stock-chart'
import { SymbolHeader } from '@/components/symbol/symbol-header'
import { AIInsightCard } from '@/components/symbol/ai-insight-card'
import { TabNav, type SymbolTab, getTabsForAsset } from '@/components/symbol/tab-nav'
import { OverviewTab } from '@/components/symbol/overview-tab'
import { NewsTab } from '@/components/symbol/news-tab'
import { TechnicalsTab } from '@/components/symbol/technicals-tab'
import { ForecastsTab } from '@/components/symbol/forecasts-tab'
import { RelatedTab } from '@/components/symbol/related-tab'
import { getMockSymbolData, getMockChartData } from '@/lib/mock-symbol-data'
import type { AssetType, SymbolData, SymbolFundamentals, SymbolQuote } from '@/types/symbol'

const PROFILE_OVERRIDES: Record<string, { name: string; exchange: string; currency: string; type: AssetType }> = {
  AAPL: { name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  TSLA: { name: 'Tesla, Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' },
  SPX: { name: 'S&P 500 Index', exchange: 'SP', currency: 'USD', type: 'index' },
  NDQ: { name: 'Nasdaq 100 Index', exchange: 'NASDAQ', currency: 'USD', type: 'index' },
  DJI: { name: 'Dow Jones Industrial Average', exchange: 'DJ', currency: 'USD', type: 'index' },
  DXY: { name: 'U.S. Dollar Index', exchange: 'TVC', currency: 'USD', type: 'index' },
  BTCUSD: { name: 'Bitcoin', exchange: 'CRYPTO', currency: 'USD', type: 'crypto' },
  ETHUSD: { name: 'Ethereum', exchange: 'CRYPTO', currency: 'USD', type: 'crypto' },
  EURUSD: { name: 'Euro / U.S. Dollar', exchange: 'FX', currency: 'USD', type: 'forex' },
  GBPUSD: { name: 'British Pound / U.S. Dollar', exchange: 'FX', currency: 'USD', type: 'forex' },
  USDJPY: { name: 'U.S. Dollar / Japanese Yen', exchange: 'FX', currency: 'JPY', type: 'forex' },
  'CL1!': { name: 'Crude Oil Futures', exchange: 'NYMEX', currency: 'USD', type: 'futures' },
}

function inferAssetProfile(symbol: string) {
  const normalized = symbol.toUpperCase()
  if (PROFILE_OVERRIDES[normalized]) return PROFILE_OVERRIDES[normalized]
  if (/^(BTC|ETH|SOL|XRP|ADA|BNB)USD$/.test(normalized)) {
    return { name: normalized.replace('USD', ''), exchange: 'CRYPTO', currency: 'USD', type: 'crypto' as const }
  }
  if (/^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY){2}$/.test(normalized) && normalized.length === 6) {
    return {
      name: normalized.slice(0, 3) + " / " + normalized.slice(3),
      exchange: 'FX',
      currency: normalized.slice(3),
      type: 'forex' as const,
    }
  }
  if (/^(SPX|NDQ|DJI|RUT|VIX|DXY)$/.test(normalized)) {
    return { name: normalized + ' Index', exchange: 'TVC', currency: 'USD', type: 'index' as const }
  }
  return { name: normalized + ' Inc.', exchange: 'NASDAQ', currency: 'USD', type: 'stock' as const }
}

function normalizeSymbolData(symbol: string, data: SymbolData): SymbolData {
  const profile = inferAssetProfile(symbol)
  const quote: SymbolQuote = {
    ...data.quote,
    symbol,
    name: profile.name,
    exchange: profile.exchange,
    currency: profile.currency,
    type: profile.type,
    marketCap: profile.type === 'forex' ? 0 : data.quote.marketCap,
  }

  const fundamentals: SymbolFundamentals = {
    ...data.fundamentals,
    sector: profile.type === 'stock' || profile.type === 'etf' ? data.fundamentals.sector : profile.type === 'crypto' ? 'Digital Assets' : profile.type === 'forex' ? 'Foreign Exchange' : profile.type === 'futures' ? 'Commodities' : 'Macro Markets',
    industry: profile.type === 'stock' || profile.type === 'etf' ? data.fundamentals.industry : profile.type === 'crypto' ? 'Layer 1 / Large-cap' : profile.type === 'forex' ? 'Major Currency Pair' : profile.type === 'futures' ? 'Front-month Contract' : 'Benchmark Index',
    ceo: profile.type === 'stock' || profile.type === 'etf' ? data.fundamentals.ceo : null,
    employees: profile.type === 'stock' || profile.type === 'etf' ? data.fundamentals.employees : null,
    description: profile.type === 'stock' || profile.type === 'etf'
      ? data.fundamentals.description
      : profile.type === 'crypto'
        ? profile.name + " is presented in a universal market workspace template so crypto symbols can use the same shell, chart, tabs, and watchlist rhythm as equities."
        : profile.type === 'forex'
          ? profile.name + " is presented in the same symbol workspace template, with the layout tuned for macro and FX workflows instead of company-specific fundamentals."
          : profile.name + " uses the same cross-asset symbol template, so indices and macro instruments feel consistent across the platform."
  }

  return { ...data, quote, fundamentals }
}

export default function SymbolPage() {
  const params = useParams()
  const symbol = (Array.isArray(params.symbol) ? params.symbol[0] : params.symbol ?? 'AAPL').toUpperCase()

  const rawData = useMemo(() => getMockSymbolData(symbol), [symbol])
  const data = useMemo(() => normalizeSymbolData(symbol, rawData), [rawData, symbol])
  const chartData = useMemo(() => getMockChartData(symbol, 365), [symbol])
  const tabs = useMemo(() => getTabsForAsset(data.quote.type), [data.quote.type])

  const [activeTab, setActiveTab] = useState<SymbolTab>('overview')

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#131722' }}>
      <SymbolHeader quote={data.quote} />

      <div className="px-4 pt-4">
        <AIInsightCard insight={data.aiInsight} symbol={symbol} />
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-lg border overflow-hidden" style={{ background: '#1e222d', borderColor: '#2a2e39', height: 380 }}>
          <StockChart data={chartData} symbol={symbol} isPositive={data.quote.change >= 0} fillHeight />
        </div>
      </div>

      <div className="px-4 pt-4 pb-8">
        <div className="rounded-lg border overflow-hidden" style={{ background: '#1e222d', borderColor: '#2a2e39' }}>
          <TabNav active={activeTab} onChange={setActiveTab} newsCount={data.news.length} tabs={tabs} />
          <TabContent tab={activeTab} data={data} symbol={symbol} />
        </div>
      </div>
    </div>
  )
}

function TabContent({ tab, data, symbol }: { tab: SymbolTab; data: SymbolData; symbol: string }) {
  switch (tab) {
    case 'overview':
      return <OverviewTab quote={data.quote} fundamentals={data.fundamentals} performance={data.performance} />
    case 'news':
      return <NewsTab news={data.news} />
    case 'technicals':
      return <TechnicalsTab technicals={data.technicals} currentPrice={data.quote.price} />
    case 'forecasts':
      return <ForecastsTab forecast={data.forecast} currentPrice={data.quote.price} />
    case 'related':
      return <RelatedTab related={data.related} symbol={symbol} />
    case 'about':
      return <AboutTab fundamentals={data.fundamentals} quote={data.quote} />
    default:
      return null
  }
}

function AboutTab({ fundamentals, quote }: { fundamentals: SymbolFundamentals; quote: SymbolQuote }) {
  const title = quote.type === 'stock' || quote.type === 'etf' ? 'Company Description' : 'Asset Description'
  return (
    <div className="p-4 flex flex-col gap-4">
      {fundamentals.description && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#787b86" }}>{title}</h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "#9598a1" }}>{fundamentals.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          ['Sector', fundamentals.sector],
          ['Industry', fundamentals.industry],
          ['CEO', fundamentals.ceo],
          ['Headquarters', fundamentals.hq],
          ['Founded', fundamentals.founded],
          ['Employees', fundamentals.employees?.toLocaleString() ?? null],
          ['Website', fundamentals.website],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div key={label as string} className="rounded p-3" style={{ background: "#131722" }}>
            <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#787b86" }}>{label}</div>
            <div className="text-[12px]" style={{ color: "#d1d4dc" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
