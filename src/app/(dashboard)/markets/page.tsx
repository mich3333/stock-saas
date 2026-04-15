'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Grid3X3, MoreHorizontal } from 'lucide-react'
import { StockChart } from '@/components/charts/stock-chart'
import type { ChartPoint } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface MarketAsset {
  name: string
  symbol: string
  category: string
  displaySymbol?: string
  value: number
  change: number
  changePercent: number
  isPositive: boolean
  volume?: number
  dayHigh?: number
  dayLow?: number
}

interface BadgeStyle {
  badge: string
  color: string
  textSize?: string
}

// ── constants ────────────────────────────────────────────────────────────────

// Badge styles per symbol (color + label in the circle)
const BADGE_MAP: Record<string, BadgeStyle> = {
  '^GSPC':   { badge: '500',  color: '#e11d48' },
  '^IXIC':   { badge: '100',  color: '#2563eb' },
  '^DJI':    { badge: '30',   color: '#f97316' },
  '^RUT':    { badge: '2000', color: '#7c3aed', textSize: '9px' },
  'GC=F':    { badge: 'Au',   color: '#eab308' },
  'SI=F':    { badge: 'Ag',   color: '#94a3b8' },
  'CL=F':    { badge: 'OIL',  color: '#0ea5e9' },
  'NG=F':    { badge: 'GAS',  color: '#10b981' },
  'BTC-USD': { badge: '₿',    color: '#f59e0b' },
  'ETH-USD': { badge: 'Ξ',    color: '#6366f1' },
  'AAPL':    { badge: '', color: '#111827' },
  'TSLA':    { badge: 'T',    color: '#dc2626' },
  'NFLX':    { badge: 'N',    color: '#dc2626' },
  'EURUSD':  { badge: '€',    color: '#2563eb' },
  'GBPUSD':  { badge: '£',    color: '#7c3aed' },
  'USDJPY':  { badge: '¥',    color: '#dc2626' },
}

// Fallback mock data for FUTURES/FOREX/STOCKS which aren't in /api/indices
const MOCK_STOCKS: MarketAsset[] = [
  { name: 'Apple Inc',          symbol: 'AAPL',   displaySymbol: 'AAPL',  category: 'Stock', value: 265.68,  change: 6.85,   changePercent: 2.65,  isPositive: true },
  { name: 'Tesla Inc',          symbol: 'TSLA',   displaySymbol: 'TSLA',  category: 'Stock', value: 390.92,  change: 26.72,  changePercent: 7.34,  isPositive: true },
  { name: 'Netflix Inc',        symbol: 'NFLX',   displaySymbol: 'NFLX',  category: 'Stock', value: 107.01,  change: 0.73,   changePercent: 0.69,  isPositive: true },
]
const MOCK_FUTURES: MarketAsset[] = [
  { name: 'Crude Oil',    symbol: 'USOIL',  displaySymbol: 'USOIL',   category: 'Future', value: 91.21,    change: -0.85,  changePercent: -0.92, isPositive: false },
  { name: 'Gold',         symbol: 'GOLD',   displaySymbol: 'GOLD',    category: 'Future', value: 4798.47,  change: -42.19, changePercent: -0.87, isPositive: false },
  { name: 'Silver',       symbol: 'SILVER', displaySymbol: 'SILVER',  category: 'Future', value: 79.27,    change: -0.22,  changePercent: -0.28, isPositive: false },
]
const MOCK_FOREX: MarketAsset[] = [
  { name: 'EUR to USD',   symbol: 'EURUSD', displaySymbol: 'EURUSD', category: 'Forex', value: 1.1801,  change: 0.00006, changePercent: 0.05, isPositive: true },
  { name: 'GBP to USD',   symbol: 'GBPUSD', displaySymbol: 'GBPUSD', category: 'Forex', value: 1.35756, change: 0.00099, changePercent: 0.07, isPositive: true },
  { name: 'USD to JPY',   symbol: 'USDJPY', displaySymbol: 'USDJPY', category: 'Forex', value: 159.008, change: 0.238,   changePercent: 0.15, isPositive: true },
]
const MOCK_INDEX_EXTRAS: MarketAsset[] = [
  // VIX & DXY to fill the INDICES section of the watchlist
  { name: 'Volatility Index', symbol: 'VIX', displaySymbol: 'VIX', category: 'Index', value: 17.98, change: -0.38, changePercent: -2.07, isPositive: false },
  { name: 'Dollar Index',     symbol: 'DXY', displaySymbol: 'DXY', category: 'Index', value: 98.043, change: -0.062, changePercent: -0.06, isPositive: false },
]

const TIMEFRAMES = ['1D', '1M', '3M', '1Y', '5Y', 'All'] as const

// ── sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ positive, large = false }: { positive: boolean; large?: boolean }) {
  const color = positive ? 'var(--green)' : 'var(--red)'
  const w = large ? 100 : 70
  const h = large ? 34 : 26
  // deterministic jagged path
  const pts = positive
    ? [0, 22, 10, 18, 20, 20, 30, 14, 40, 17, 50, 9, 60, 12, 70, 6, 80, 8, 90, 2, 100, 4]
    : [0, 4, 10, 8, 20, 6, 30, 12, 40, 10, 50, 16, 60, 14, 70, 20, 80, 18, 90, 24, 100, 22]
  const d = pts.reduce((acc, v, i) => {
    if (i % 2 === 0) return acc + (i === 0 ? `M${(v / 100) * w},` : ` L${(v / 100) * w},`)
    return acc + v
  }, '')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── badge ─────────────────────────────────────────────────────────────────────

function AssetBadge({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const badge = BADGE_MAP[symbol]
  const color = badge?.color ?? '#64748b'
  const label = badge?.badge ?? symbol.slice(0, 2)
  const textSize = badge?.textSize ?? (size < 30 ? '9px' : size < 36 ? '10px' : '11px')
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: textSize,
        boxShadow: `0 4px 14px ${color}55`,
      }}
    >
      {label}
    </div>
  )
}

// ── index card (horizontal) ──────────────────────────────────────────────────

function IndexCard({
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
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all border min-w-[230px] ${
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--panel-strong)]'
      }`}
    >
      <AssetBadge symbol={asset.symbol} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {asset.name}
        </p>
        <p className="font-bold text-base tabular-nums leading-tight truncate" style={{ color: 'var(--foreground)' }}>
          {asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>USD</span>
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {asset.isPositive
            ? <TrendingUp size={10} style={{ color: 'var(--green)' }} />
            : <TrendingDown size={10} style={{ color: 'var(--red)' }} />}
          <span
            className="ticker-mono text-[11px] font-semibold"
            style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)' }}
          >
            {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ── watchlist row ─────────────────────────────────────────────────────────────

function WatchRow({ asset, selected, onClick }: { asset: MarketAsset; selected?: boolean; onClick?: () => void }) {
  const sym = asset.displaySymbol ?? (
    asset.symbol === '^GSPC' ? 'SPX'
    : asset.symbol === '^IXIC' ? 'NDQ'
    : asset.symbol === '^DJI' ? 'DJI'
    : asset.symbol === 'GC=F' ? 'GOLD'
    : asset.symbol === 'SI=F' ? 'SILVER'
    : asset.symbol === 'CL=F' ? 'USOIL'
    : asset.symbol === 'NG=F' ? 'NATGAS'
    : asset.symbol === 'BTC-USD' ? 'BTCUS'
    : asset.symbol === 'ETH-USD' ? 'ETHUS'
    : asset.symbol
  )
  return (
    <button
      onClick={onClick}
      className={`w-full grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-1.5 text-left transition-colors ${
        selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--panel-muted)]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AssetBadge symbol={asset.symbol} size={18} />
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {sym}
        </span>
      </div>
      <span className="ticker-mono text-[11px] tabular-nums text-right" style={{ color: 'var(--foreground)' }}>
        {asset.value.toLocaleString('en-US', { maximumFractionDigits: asset.value < 10 ? 4 : 2 })}
      </span>
      <span
        className="ticker-mono text-[11px] tabular-nums text-right"
        style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)', minWidth: 48 }}
      >
        {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
      </span>
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [apiAssets, setApiAssets] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null)
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1D')
  const abortRef = useRef<AbortController | null>(null)

  // Fetch indices
  useEffect(() => {
    fetch('/api/indices')
      .then(r => r.json())
      .then(({ indices: data }) => {
        setApiAssets(data ?? [])
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

  // Real indices from API (S&P, NASDAQ, DOW)
  const realIndices = apiAssets.filter(a => a.category === 'Index')

  // Fake "Russell 2000" card if API didn't return it
  const russellCard: MarketAsset = {
    name: 'US 2000 small cap',
    symbol: '^RUT',
    category: 'Index',
    value: 2712.32,
    change: 4.07,
    changePercent: 0.15,
    isPositive: true,
  }
  const indicesForCards = [...realIndices.slice(0, 3), russellCard]

  const commodities = apiAssets.filter(a => a.category === 'Commodity')
  const crypto = apiAssets.filter(a => a.category === 'Crypto')

  // Watchlist sections (matching TradingView reference)
  const watchSections = [
    { label: 'INDICES',  items: [...realIndices, ...MOCK_INDEX_EXTRAS] },
    { label: 'STOCKS',   items: MOCK_STOCKS },
    { label: 'FUTURES',  items: MOCK_FUTURES.length ? MOCK_FUTURES : commodities },
    { label: 'FOREX',    items: MOCK_FOREX },
    { label: 'CRYPTO',   items: crypto },
  ]

  return (
    <div className="flex h-full min-h-screen">
      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-8 pt-14 pb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-tv)' }}
          >
            Markets, everywhere{' '}
            <ChevronDown className="inline-block" size={40} style={{ color: 'var(--text-secondary)' }} />
          </motion.h1>
        </div>

        {/* Indices section */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Indices <ChevronRight size={20} className="mt-1" />
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-[84px] rounded-2xl animate-pulse" style={{ background: 'var(--panel-muted)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {indicesForCards.map((asset, i) => (
                <IndexCard
                  key={asset.symbol}
                  asset={asset}
                  selected={selectedAsset?.symbol === asset.symbol}
                  onClick={() => setSelectedAsset(asset)}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Chart */}
          {selectedAsset && (
            <motion.div
              key={selectedAsset.symbol}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--border)] overflow-hidden"
              style={{ background: 'var(--panel)' }}
            >
              {/* chart body */}
              <div className="px-2 pt-2" style={{ minHeight: 360 }}>
                {chartLoading ? (
                  <div className="h-[340px] rounded-xl animate-pulse" style={{ background: 'var(--panel-muted)' }} />
                ) : (
                  <StockChart
                    data={chartHistory}
                    symbol={selectedAsset.symbol}
                    isPositive={selectedAsset.isPositive}
                  />
                )}
              </div>

              {/* timeframe tabs — bottom-left like TradingView */}
              <div className="flex items-center gap-1 px-3 py-2 border-t border-[var(--border)]">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      activeTimeframe === tf
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Right watchlist sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden xl:flex flex-col w-[260px] border-l flex-shrink-0 overflow-y-auto"
        style={{
          background: 'var(--panel)',
          borderColor: 'var(--border)',
        }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            Watchlist <ChevronDown size={14} />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-[var(--accent-soft)]" style={{ color: 'var(--text-secondary)' }}>
              <Plus size={14} />
            </button>
            <button className="p-1 rounded hover:bg-[var(--accent-soft)]" style={{ color: 'var(--text-secondary)' }}>
              <Grid3X3 size={14} />
            </button>
            <button className="p-1 rounded hover:bg-[var(--accent-soft)]" style={{ color: 'var(--text-secondary)' }}>
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Symbol</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)' }}>Last</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)', minWidth: 48 }}>Chg%</span>
        </div>

        {/* sections */}
        <div className="flex flex-col pb-4">
          {watchSections.map(section => {
            if (!section.items.length) return null
            return (
              <div key={section.label}>
                <div
                  className="flex items-center gap-1 px-3 py-1.5 mt-2 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ChevronDown size={10} />
                  <p className="text-[10px] font-bold tracking-widest">{section.label}</p>
                </div>
                {section.items.map(asset => (
                  <WatchRow
                    key={`${section.label}-${asset.symbol}`}
                    asset={asset}
                    selected={selectedAsset?.symbol === asset.symbol}
                    onClick={() => asset.category === 'Index' && setSelectedAsset(asset)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
