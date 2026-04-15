'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { StockChart } from '@/components/charts/stock-chart'
import type { ChartPoint } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface MarketAsset {
  name: string
  symbol: string
  category: string
  value: number
  change: number
  changePercent: number
  isPositive: boolean
  volume: number
  dayHigh: number
  dayLow: number
  badge?: string       // short label shown in the coloured circle
  badgeColor?: string  // tailwind bg class
}

type TabId = 'Indices' | 'Commodities' | 'Crypto' | 'Forex'

interface Tab {
  id: TabId
  label: string
  categories: string[]
}

// ── constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'Indices',     label: 'Indices',     categories: ['Index'] },
  { id: 'Commodities', label: 'Commodities', categories: ['Commodity'] },
  { id: 'Crypto',      label: 'Crypto',      categories: ['Crypto'] },
]

// Badge styles per symbol
const BADGE_MAP: Record<string, { badge: string; color: string }> = {
  '^GSPC':   { badge: '500',  color: '#ef4444' },
  '^IXIC':   { badge: '100',  color: '#3b82f6' },
  '^DJI':    { badge: '30',   color: '#f97316' },
  '^RUT':    { badge: '2000', color: '#8b5cf6' },
  'GC=F':    { badge: 'Au',   color: '#eab308' },
  'SI=F':    { badge: 'Ag',   color: '#94a3b8' },
  'CL=F':    { badge: 'OIL',  color: '#0ea5e9' },
  'NG=F':    { badge: 'GAS',  color: '#10b981' },
  'BTC-USD': { badge: '₿',    color: '#f59e0b' },
  'ETH-USD': { badge: 'Ξ',    color: '#6366f1' },
}

// ── tiny sparkline SVG ───────────────────────────────────────────────────────

function Sparkline({ positive }: { positive: boolean }) {
  // deterministic fake sparkline path so it looks real on first render
  const pts = positive
    ? [0,12,8,10,16,14,22,9,30,11,38,7,46,4,54,6,62,2,70,0]
    : [0,0,8,3,16,1,22,6,30,4,38,9,46,7,54,11,62,8,70,12]
  const d = pts.reduce((acc, v, i) =>
    i % 2 === 0 ? acc + (i === 0 ? `M${v},` : ` L${v},`) : acc + v, '')
  const color = positive ? 'var(--green)' : 'var(--red)'
  return (
    <svg width="70" height="28" viewBox="0 0 70 28" fill="none" className="opacity-80">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── index card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  selected,
  onClick,
  index,
}: {
  asset: MarketAsset
  selected: boolean
  onClick: () => void
  index: number
}) {
  const badge = BADGE_MAP[asset.symbol]
  const color = badge?.color ?? '#2563eb'

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`flex flex-col gap-3 p-4 rounded-2xl text-left transition-all border w-full min-w-[180px] cursor-pointer ${
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)]'
      }`}
      style={{ boxShadow: selected ? '0 0 0 2px var(--accent)' : 'var(--shadow-lg)' }}
    >
      {/* top row: badge + sparkline */}
      <div className="flex items-center justify-between">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0"
          style={{ background: color, boxShadow: `0 4px 14px ${color}55` }}
        >
          {badge?.badge ?? asset.symbol.slice(0, 3)}
        </div>
        <Sparkline positive={asset.isPositive} />
      </div>

      {/* name */}
      <div>
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {asset.name}
        </p>
        <p className="font-bold text-lg tabular-nums leading-tight" style={{ color: 'var(--foreground)' }}>
          {asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>USD</span>
        </p>
      </div>

      {/* change */}
      <div className="flex items-center gap-1">
        {asset.isPositive
          ? <TrendingUp size={12} style={{ color: 'var(--green)' }} />
          : <TrendingDown size={12} style={{ color: 'var(--red)' }} />}
        <span
          className="ticker-mono text-xs font-semibold"
          style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)' }}
        >
          {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </span>
      </div>
    </motion.button>
  )
}

// ── watchlist row ─────────────────────────────────────────────────────────────

function WatchRow({ asset }: { asset: MarketAsset }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--accent-soft)] transition-colors cursor-pointer group">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ background: BADGE_MAP[asset.symbol]?.color ?? '#64748b' }}
        >
          {(BADGE_MAP[asset.symbol]?.badge ?? asset.symbol.slice(0, 2)).slice(0, 2)}
        </div>
        <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {asset.symbol === '^GSPC' ? 'SPX'
            : asset.symbol === '^IXIC' ? 'NDQ'
            : asset.symbol === '^DJI' ? 'DJI'
            : asset.name.slice(0, 8)}
        </span>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="ticker-mono text-[11px] tabular-nums" style={{ color: 'var(--foreground)' }}>
          {asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </span>
        <span
          className="ticker-mono text-[10px] tabular-nums"
          style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)' }}
        >
          {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [indices, setIndices] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('Indices')
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null)
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch indices / commodities / crypto
  useEffect(() => {
    fetch('/api/indices')
      .then(r => r.json())
      .then(({ indices: data }) => {
        setIndices(data ?? [])
        // auto-select first index
        const first = (data ?? []).find((a: MarketAsset) => a.category === 'Index')
        if (first) setSelectedAsset(first)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch chart data when selected asset changes
  useEffect(() => {
    if (!selectedAsset) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setChartLoading(true)
    setChartHistory([])

    const encoded = encodeURIComponent(selectedAsset.symbol)
    fetch(`/api/stocks/${encoded}?history=true`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (data?.history) setChartHistory(data.history) })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setChartLoading(false) })
  }, [selectedAsset?.symbol])

  const visibleCategories = TABS.find(t => t.id === activeTab)?.categories ?? ['Index']
  const visibleAssets = indices.filter(a => visibleCategories.includes(a.category))

  // Sidebar watchlist sections
  const sections: { label: string; filter: string[] }[] = [
    { label: 'INDICES',     filter: ['Index'] },
    { label: 'COMMODITIES', filter: ['Commodity'] },
    { label: 'CRYPTO',      filter: ['Crypto'] },
  ]

  return (
    <div className="flex h-full min-h-screen">
      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Markets,{' '}
            <span style={{ color: 'var(--accent)' }}>everywhere</span>{' '}
            <span className="text-2xl">↓</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Live quotes across indices, commodities, and crypto.
          </p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 w-fit rounded-full border border-[var(--border)] bg-[var(--panel)]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-36 rounded-2xl animate-pulse"
                style={{ background: 'var(--panel-muted)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {visibleAssets.map((asset, i) => (
              <AssetCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset?.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Chart section */}
        {selectedAsset && (
          <motion.div
            key={selectedAsset.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--panel)', boxShadow: 'var(--shadow-lg)' }}
          >
            {/* chart header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                    {selectedAsset.name}
                  </span>
                  <span
                    className="ticker-mono text-xs px-2 py-0.5 rounded-full border"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    {selectedAsset.symbol}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-3xl tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {selectedAsset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>USD</span>
                  <span
                    className="ticker-mono text-sm font-semibold"
                    style={{ color: selectedAsset.isPositive ? 'var(--green)' : 'var(--red)' }}
                  >
                    {selectedAsset.isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              <button
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:bg-[var(--accent-soft)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Full chart <ChevronRight size={12} />
              </button>
            </div>

            {/* chart body */}
            <div className="px-2 pb-2 pt-2" style={{ minHeight: 340 }}>
              {chartLoading ? (
                <div
                  className="h-[320px] rounded-xl animate-pulse"
                  style={{ background: 'var(--panel-muted)' }}
                />
              ) : (
                <StockChart
                  data={chartHistory}
                  symbol={selectedAsset.symbol}
                  isPositive={selectedAsset.isPositive}
                />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Right watchlist sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden xl:flex flex-col w-60 border-l flex-shrink-0 overflow-y-auto"
        style={{
          background: 'var(--panel)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="px-3 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Watchlist</span>
        </div>

        {/* column headers */}
        <div className="flex items-center justify-between px-3 py-1 mb-1">
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Symbol</span>
          <div className="flex gap-4">
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Last</span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Chg%</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1 pb-4">
          {sections.map(section => {
            const assets = indices.filter(a => section.filter.includes(a.category))
            if (!assets.length) return null
            return (
              <div key={section.label}>
                <p
                  className="px-3 py-2 text-[10px] font-bold tracking-widest"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {section.label}
                </p>
                {assets.map(asset => (
                  <WatchRow key={asset.symbol} asset={asset} />
                ))}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
