'use client'

import type { AssetType, SymbolFundamentals, SymbolPerformance, SymbolQuote } from '@/types/symbol'

function fmt(n: number | null, prefix = "") {
  if (n === null || n === 0) return "—"
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`
  return `${prefix}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

const PERF_WINDOWS = [
  { key: 'd1', label: '1D' },
  { key: 'd5', label: '5D' },
  { key: 'm1', label: '1M' },
  { key: 'm3', label: '3M' },
  { key: 'm6', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: 'y1', label: '1Y' },
  { key: 'y5', label: '5Y' },
] as const

function getKeyStats(quote: SymbolQuote, fundamentals: SymbolFundamentals) {
  const equityStats = [
    { label: 'Market Cap', value: fmt(quote.marketCap, '$') },
    { label: 'P/E Ratio', value: fundamentals.pe?.toFixed(1) ?? '—' },
    { label: 'Forward P/E', value: fundamentals.forwardPe?.toFixed(1) ?? '—' },
    { label: 'EPS (TTM)', value: fundamentals.eps ? '$' + fundamentals.eps.toFixed(2) : '—' },
    { label: 'Revenue', value: fmt(fundamentals.revenue, '$') },
    { label: 'Net Income', value: fmt(fundamentals.netIncome, '$') },
    { label: 'Div Yield', value: fundamentals.dividendYield ? fundamentals.dividendYield.toFixed(2) + '%' : 'N/A' },
    { label: 'Beta', value: fundamentals.beta?.toFixed(2) ?? '—' },
    { label: 'Shares Out.', value: fundamentals.sharesOutstanding ? fmt(fundamentals.sharesOutstanding) : '—' },
    { label: '52W High', value: '$' + fundamentals.fiftyTwoWeekHigh.toFixed(2), color: '#26a69a' },
    { label: '52W Low', value: '$' + fundamentals.fiftyTwoWeekLow.toFixed(2), color: '#ef5350' },
    { label: 'Avg Volume', value: fmt(quote.avgVolume) },
  ]

  if (quote.type === 'stock' || quote.type === 'etf') return equityStats

  const macroStats = [
    { label: 'Session High', value: quote.high.toFixed(2), color: '#26a69a' },
    { label: 'Session Low', value: quote.low.toFixed(2), color: '#ef5350' },
    { label: 'Prev Close', value: quote.prevClose.toFixed(2) },
    { label: 'Volume', value: fmt(quote.volume) },
    { label: 'Avg Volume', value: fmt(quote.avgVolume) },
    { label: '52W High', value: fundamentals.fiftyTwoWeekHigh.toFixed(2), color: '#26a69a' },
    { label: '52W Low', value: fundamentals.fiftyTwoWeekLow.toFixed(2), color: '#ef5350' },
    { label: 'Currency', value: quote.currency },
  ]

  if (quote.type === 'crypto') {
    return [
      { label: 'Market Cap', value: fmt(quote.marketCap, '$') },
      { label: '24h Volume', value: fmt(quote.volume, '$') },
      { label: '30d Avg Vol', value: fmt(quote.avgVolume, '$') },
      ...macroStats.slice(1),
    ]
  }

  return macroStats
}

function getAboutTitle(type: AssetType) {
  switch (type) {
    case 'crypto':
      return 'About this asset'
    case 'index':
      return 'About this index'
    case 'forex':
      return 'About this pair'
    case 'futures':
      return 'About this contract'
    case 'bond':
      return 'About this bond'
    default:
      return 'About'
  }
}

interface Props {
  quote: SymbolQuote
  fundamentals: SymbolFundamentals
  performance: SymbolPerformance
}

export function OverviewTab({ quote, fundamentals, performance }: Props) {
  const stats = getKeyStats(quote, fundamentals)
  const aboutTitle = getAboutTitle(quote.type)
  const range = fundamentals.fiftyTwoWeekHigh - fundamentals.fiftyTwoWeekLow
  const pct = range > 0 ? ((quote.price - fundamentals.fiftyTwoWeekLow) / range) * 100 : 0

  return (
    <div className="flex flex-col gap-5 p-4">
      <Section title="Performance">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {PERF_WINDOWS.map(w => {
            const val = performance[w.key]
            const isPos = val >= 0
            return (
              <div key={w.key} className="flex flex-col items-center justify-center rounded-md py-2.5 px-1" style={{ background: "#131722" }}>
                <span className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#787b86" }}>{w.label}</span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: isPos ? "#26a69a" : "#ef5350" }}>
                  {isPos ? "+" : ""}{val.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="52-Week Range">
        <div className="px-1">
          <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "#787b86" }}>
            <span>{fundamentals.fiftyTwoWeekLow.toFixed(2)}</span>
            <span>{fundamentals.fiftyTwoWeekHigh.toFixed(2)}</span>
          </div>
          <div className="relative h-1.5 rounded-full" style={{ background: "#2a2e39" }}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "linear-gradient(to right, #2962ff, #26a69a)" }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2" style={{ left: `calc(${Math.max(0, Math.min(100, pct))}% - 6px)`, background: "#d1d4dc", borderColor: "#131722" }} />
          </div>
          <div className="text-center mt-1.5 text-[11px]" style={{ color: "#787b86" }}>
            Current: <span style={{ color: "#d1d4dc" }}>{quote.price.toFixed(2)}</span>
          </div>
        </div>
      </Section>

      <Section title="Key Statistics">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {stats.map(stat => (
            <StatRow key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
          ))}
        </div>
      </Section>

      {fundamentals.description && (
        <Section title={aboutTitle}>
          <p className="text-[13px] leading-relaxed" style={{ color: "#9598a1" }}>
            {fundamentals.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-3">
            {fundamentals.sector && <StatRow label="Sector" value={fundamentals.sector} />}
            {fundamentals.industry && <StatRow label="Industry" value={fundamentals.industry} />}
            {fundamentals.ceo && <StatRow label="CEO" value={fundamentals.ceo} />}
            {fundamentals.hq && <StatRow label="HQ" value={fundamentals.hq} />}
            {fundamentals.founded && <StatRow label="Founded" value={fundamentals.founded} />}
            {fundamentals.employees && <StatRow label="Employees" value={fundamentals.employees.toLocaleString()} />}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#787b86" }}>{title}</h3>
      {children}
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 rounded" style={{ background: "#131722" }}>
      <span className="text-[11px]" style={{ color: "#787b86" }}>{label}</span>
      <span className="text-[12px] font-medium tabular-nums" style={{ color: color ?? "#d1d4dc" }}>{value}</span>
    </div>
  )
}
