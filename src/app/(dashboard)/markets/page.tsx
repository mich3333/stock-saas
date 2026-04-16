'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Grid3X3, MoreHorizontal } from 'lucide-react'
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
}

interface BadgeStyle {
  badge: string
  color: string
}

// ── constants ────────────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, BadgeStyle> = {
  '^GSPC':   { badge: '500',  color: '#e11d48' },
  '^IXIC':   { badge: '100',  color: '#2563eb' },
  '^DJI':    { badge: '30',   color: '#f97316' },
  '^RUT':    { badge: '2000', color: '#7c3aed' },
  'GC=F':    { badge: 'Au',   color: '#eab308' },
  'SI=F':    { badge: 'Ag',   color: '#94a3b8' },
  'CL=F':    { badge: 'OIL',  color: '#0ea5e9' },
  'NG=F':    { badge: 'GAS',  color: '#10b981' },
  'BTC-USD': { badge: '₿',    color: '#f59e0b' },
  'ETH-USD': { badge: 'Ξ',    color: '#6366f1' },
  'AAPL':    { badge: 'AA',   color: '#111827' },
  'TSLA':    { badge: 'T',    color: '#dc2626' },
  'NFLX':    { badge: 'N',    color: '#dc2626' },
  'EURUSD':  { badge: '€',    color: '#2563eb' },
  'GBPUSD':  { badge: '£',    color: '#7c3aed' },
  'USDJPY':  { badge: '¥',    color: '#dc2626' },
  'VIX':     { badge: 'VIX',  color: '#64748b' },
  'DXY':     { badge: 'DXY',  color: '#64748b' },
}

const RUSSELL: MarketAsset = {
  name: 'US 2000 small cap',
  symbol: '^RUT',
  category: 'Index',
  value: 2712.32,
  change: 4.07,
  changePercent: 0.15,
  isPositive: true,
}

const MOCK_STOCKS: MarketAsset[] = [
  { name: 'Apple Inc',   symbol: 'AAPL', category: 'Stock', value: 265.68,  change: 6.85,  changePercent: 2.65, isPositive: true },
  { name: 'Tesla Inc',   symbol: 'TSLA', category: 'Stock', value: 390.92,  change: 26.72, changePercent: 7.34, isPositive: true },
  { name: 'Netflix Inc', symbol: 'NFLX', category: 'Stock', value: 107.01,  change: 0.73,  changePercent: 0.69, isPositive: true },
]
const MOCK_FUTURES: MarketAsset[] = [
  { name: 'Crude Oil', symbol: 'USOIL',  category: 'Future', value: 91.21,   change: -0.85,  changePercent: -0.92, isPositive: false },
  { name: 'Gold',      symbol: 'GOLD',   category: 'Future', value: 4798.47, change: -42.19, changePercent: -0.87, isPositive: false },
  { name: 'Silver',    symbol: 'SILVER', category: 'Future', value: 79.27,   change: -0.22,  changePercent: -0.28, isPositive: false },
]
const MOCK_FOREX: MarketAsset[] = [
  { name: 'EUR/USD', symbol: 'EURUSD', category: 'Forex', value: 1.1801,  change: 0.00006, changePercent: 0.05, isPositive: true },
  { name: 'GBP/USD', symbol: 'GBPUSD', category: 'Forex', value: 1.35756, change: 0.00099, changePercent: 0.07, isPositive: true },
  { name: 'USD/JPY', symbol: 'USDJPY', category: 'Forex', value: 159.008, change: 0.238,   changePercent: 0.15, isPositive: true },
]
const MOCK_INDEX_EXTRAS: MarketAsset[] = [
  { name: 'Volatility Index', symbol: 'VIX', category: 'Index', value: 17.98,  change: -0.38,  changePercent: -2.07, isPositive: false },
  { name: 'Dollar Index',     symbol: 'DXY', category: 'Index', value: 98.043, change: -0.062, changePercent: -0.06, isPositive: false },
]

// ── helpers ───────────────────────────────────────────────────────────────────

function AssetBadge({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const b = BADGE_MAP[symbol]
  const color = b?.color ?? '#64748b'
  const label = b?.badge ?? symbol.slice(0, 2)
  const fs = size <= 20 ? '9px' : size <= 30 ? '10px' : label.length >= 3 ? '10px' : '12px'
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: fs, boxShadow: `0 4px 14px ${color}44` }}
    >
      {label}
    </div>
  )
}

// ── SVG area chart (clean, TradingView-style) ─────────────────────────────────

function AreaChart({ data, isPositive, height = 260 }: { data: ChartPoint[]; isPositive: boolean; height?: number }) {
  const W = 900
  const H = height
  const PAD = 4

  if (data.length < 2) return (
    <div style={{ height }} className="flex items-center justify-center">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading chart…</span>
    </div>
  )

  const closes = data.map(d => d.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1

  const px = (i: number) => PAD + (i / (closes.length - 1)) * (W - PAD * 2)
  const py = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2)

  const pts = closes.map((v, i) => `${px(i)},${py(v)}`).join(' ')
  const color = isPositive ? '#22c55e' : '#ef4444'
  const gradId = `grad-${isPositive ? 'g' : 'r'}`

  const polyline = `${px(0)},${py(closes[0])} ${pts} ${px(closes.length - 1)},${H} ${px(0)},${H}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* gradient fill */}
      <polygon points={polyline} fill={`url(#${gradId})`} />
      {/* line */}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// ── small index card ──────────────────────────────────────────────────────────

function SmallCard({ asset, selected, onClick, index }: {
  asset: MarketAsset; selected: boolean; onClick: () => void; index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all border w-full ${
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--panel-strong)]'
      }`}
    >
      <AssetBadge symbol={asset.symbol} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{asset.name}</p>
        <p className="font-bold text-sm tabular-nums" style={{ color: 'var(--foreground)' }}>
          {asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>USD</span>
        </p>
        <span className="ticker-mono text-[11px] font-semibold" style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)' }}>
          {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </span>
      </div>
    </motion.button>
  )
}

// ── watchlist row ─────────────────────────────────────────────────────────────

function WatchRow({ asset }: { asset: MarketAsset }) {
  const sym = asset.displaySymbol ?? (
    asset.symbol === '^GSPC' ? 'SPX'
    : asset.symbol === '^IXIC' ? 'NDQ'
    : asset.symbol === '^DJI' ? 'DJI'
    : asset.symbol === 'GC=F' ? 'GOLD'
    : asset.symbol === 'SI=F' ? 'SILVER'
    : asset.symbol === 'CL=F' ? 'USOIL'
    : asset.symbol === 'NG=F' ? 'NATGAS'
    : asset.symbol === 'BTC-USD' ? 'BTCUSD'
    : asset.symbol === 'ETH-USD' ? 'ETHUSD'
    : asset.symbol
  )
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-1.5 hover:bg-[var(--panel-muted)] transition-colors cursor-pointer">
      <div className="flex items-center gap-2 min-w-0">
        <AssetBadge symbol={asset.symbol} size={18} />
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>{sym}</span>
      </div>
      <span className="ticker-mono text-[11px] tabular-nums text-right" style={{ color: 'var(--foreground)' }}>
        {asset.value.toLocaleString('en-US', { maximumFractionDigits: asset.value < 10 ? 4 : 2 })}
      </span>
      <span className="ticker-mono text-[11px] tabular-nums text-right" style={{ color: asset.isPositive ? 'var(--green)' : 'var(--red)', minWidth: 48 }}>
        {asset.isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
      </span>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [apiAssets, setApiAssets] = useState<MarketAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null)
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

  useEffect(() => {
    if (!selectedAsset) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setChartLoading(true)
    setChartHistory([])

    fetch(`/api/stocks/${encodeURIComponent(selectedAsset.symbol)}?history=true&period=1mo`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d?.history) setChartHistory(d.history) })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setChartLoading(false) })
  }, [selectedAsset?.symbol]) // eslint-disable-line react-hooks/exhaustive-deps

  const realIndices = apiAssets.filter(a => a.category === 'Index')
  const indicesForCards = [...realIndices.slice(0, 3), RUSSELL]
  const otherCards = indicesForCards.filter(a => a.symbol !== selectedAsset?.symbol)

  const commodities = apiAssets.filter(a => a.category === 'Commodity')
  const crypto = apiAssets.filter(a => a.category === 'Crypto')

  const watchSections = [
    { label: 'INDICES',    items: [...realIndices, ...MOCK_INDEX_EXTRAS] },
    { label: 'STOCKS',     items: MOCK_STOCKS },
    { label: 'FUTURES',    items: MOCK_FUTURES.length ? MOCK_FUTURES : commodities },
    { label: 'FOREX',      items: MOCK_FOREX },
    { label: 'CRYPTO',     items: crypto },
  ]

  return (
    <div className="flex h-full min-h-screen">
      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl">

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-6 flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: 'var(--foreground)' }}
        >
          Market summary <ChevronRight size={18} className="mt-0.5" />
        </motion.h1>

        {/* Featured card: selected asset + area chart */}
        {selectedAsset && (
          <motion.div
            key={selectedAsset.symbol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] overflow-hidden mb-4"
            style={{ background: 'var(--panel)' }}
          >
            {/* card header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-3">
              <AssetBadge symbol={selectedAsset.symbol} size={40} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                    {selectedAsset.name}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded border ticker-mono"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                    {selectedAsset.symbol === '^GSPC' ? 'SPX'
                      : selectedAsset.symbol === '^IXIC' ? 'NDQ'
                      : selectedAsset.symbol === '^DJI' ? 'DJI'
                      : selectedAsset.symbol}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <p className="font-bold text-3xl tabular-nums mt-0.5" style={{ color: 'var(--foreground)' }}>
                  {selectedAsset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-secondary)' }}>USD</span>
                </p>
                <span className="ticker-mono text-sm font-semibold"
                  style={{ color: selectedAsset.isPositive ? 'var(--green)' : 'var(--red)' }}>
                  {selectedAsset.isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* area chart — inside the card, full-width */}
            <div className="pb-1">
              {chartLoading || chartHistory.length === 0 ? (
                <div className="h-[260px] animate-pulse mx-2 rounded-xl"
                  style={{ background: 'var(--panel-muted)' }} />
              ) : (
                <AreaChart
                  key={selectedAsset.symbol}
                  data={chartHistory}
                  isPositive={selectedAsset.isPositive}
                  height={260}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Major indices label */}
        {!loading && (
          <h2 className="text-base font-bold mb-3 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}>
            Major indices <ChevronRight size={15} />
          </h2>
        )}

        {/* Other index cards — smaller, no chart */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[70px] rounded-2xl animate-pulse" style={{ background: 'var(--panel-muted)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherCards.map((asset, i) => (
              <SmallCard
                key={asset.symbol}
                asset={asset}
                selected={false}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right watchlist ────────────────────────────────────────────── */}
      <aside className="hidden xl:flex flex-col w-[260px] border-l flex-shrink-0 overflow-y-auto"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>

        {/* header */}
        <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            Watchlist <ChevronDown size={14} />
          </div>
          <div className="flex items-center gap-1">
            {[Plus, Grid3X3, MoreHorizontal].map((Icon, i) => (
              <button key={i} className="p-1 rounded hover:bg-[var(--accent-soft)]" style={{ color: 'var(--text-secondary)' }}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Symbol</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)' }}>Last</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)', minWidth: 48 }}>Chg%</span>
        </div>

        <div className="flex flex-col pb-4">
          {watchSections.map(section => {
            if (!section.items.length) return null
            return (
              <div key={section.label}>
                <div className="flex items-center gap-1 px-3 py-1.5 mt-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronDown size={10} />
                  <p className="text-[10px] font-bold tracking-widest">{section.label}</p>
                </div>
                {section.items.map(asset => (
                  <WatchRow key={`${section.label}-${asset.symbol}`} asset={asset} />
                ))}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
