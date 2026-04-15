'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Grid3X3, MoreHorizontal } from 'lucide-react'
import { StockChart } from '@/components/charts/stock-chart'
import type { ChartPoint } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface ForexAsset {
  name: string
  symbol: string
  displaySymbol?: string
  category: 'Major' | 'Minor' | 'Exotic' | 'Metal'
  value: number
  change: number
  changePercent: number
  isPositive: boolean
}

interface BadgeStyle {
  badge: string
  color: string
  textSize?: string
}

// ── constants ────────────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, BadgeStyle> = {
  // Majors
  EURUSD: { badge: '€$', color: '#2563eb', textSize: '11px' },
  GBPUSD: { badge: '£$', color: '#7c3aed', textSize: '11px' },
  USDJPY: { badge: '$¥', color: '#dc2626', textSize: '11px' },
  AUDUSD: { badge: 'A$', color: '#0ea5e9', textSize: '11px' },
  USDCAD: { badge: '$C', color: '#e11d48', textSize: '11px' },
  USDCHF: { badge: '$F', color: '#f97316', textSize: '11px' },
  // Minors
  EURGBP: { badge: '€£', color: '#6366f1', textSize: '11px' },
  EURJPY: { badge: '€¥', color: '#8b5cf6', textSize: '11px' },
  GBPJPY: { badge: '£¥', color: '#a855f7', textSize: '11px' },
  EURAUD: { badge: '€A', color: '#14b8a6', textSize: '11px' },
  // Exotics
  USDTRY: { badge: '$₺', color: '#b91c1c', textSize: '11px' },
  USDZAR: { badge: '$R', color: '#16a34a', textSize: '11px' },
  USDMXN: { badge: '$M', color: '#ca8a04', textSize: '11px' },
  // Metals
  XAUUSD: { badge: 'Au', color: '#eab308' },
  XAGUSD: { badge: 'Ag', color: '#94a3b8' },
}

const MAJORS: ForexAsset[] = [
  { name: 'Euro / US Dollar',        symbol: 'EURUSD', category: 'Major', value: 1.0812,  change: 0.0015,  changePercent: 0.14,  isPositive: true  },
  { name: 'British Pound / US Dollar', symbol: 'GBPUSD', category: 'Major', value: 1.2534,  change: -0.0021, changePercent: -0.17, isPositive: false },
  { name: 'US Dollar / Japanese Yen',  symbol: 'USDJPY', category: 'Major', value: 157.284, change: 0.412,   changePercent: 0.26,  isPositive: true  },
  { name: 'Australian Dollar / US Dollar', symbol: 'AUDUSD', category: 'Major', value: 0.6524, change: -0.0008, changePercent: -0.12, isPositive: false },
  { name: 'US Dollar / Canadian Dollar',   symbol: 'USDCAD', category: 'Major', value: 1.3721, change: 0.0011, changePercent: 0.08, isPositive: true  },
  { name: 'US Dollar / Swiss Franc',       symbol: 'USDCHF', category: 'Major', value: 0.9065, change: -0.0017, changePercent: -0.19, isPositive: false },
]

const MINORS: ForexAsset[] = [
  { name: 'Euro / British Pound',        symbol: 'EURGBP', category: 'Minor', value: 0.8625, change: 0.0009,  changePercent: 0.10, isPositive: true  },
  { name: 'Euro / Japanese Yen',         symbol: 'EURJPY', category: 'Minor', value: 170.06, change: 0.48,    changePercent: 0.28, isPositive: true  },
  { name: 'British Pound / Japanese Yen', symbol: 'GBPJPY', category: 'Minor', value: 197.198, change: -0.124, changePercent: -0.06, isPositive: false },
  { name: 'Euro / Australian Dollar',    symbol: 'EURAUD', category: 'Minor', value: 1.6572, change: 0.0033,  changePercent: 0.20, isPositive: true  },
]

const EXOTICS: ForexAsset[] = [
  { name: 'US Dollar / Turkish Lira',  symbol: 'USDTRY', category: 'Exotic', value: 32.4821, change: 0.1253, changePercent: 0.39, isPositive: true  },
  { name: 'US Dollar / South African Rand', symbol: 'USDZAR', category: 'Exotic', value: 18.7241, change: -0.0415, changePercent: -0.22, isPositive: false },
  { name: 'US Dollar / Mexican Peso',  symbol: 'USDMXN', category: 'Exotic', value: 16.9412, change: 0.0271, changePercent: 0.16, isPositive: true  },
]

const METALS: ForexAsset[] = [
  { name: 'Gold / US Dollar',   symbol: 'XAUUSD', category: 'Metal', value: 2381.45, change: 8.22,  changePercent: 0.35, isPositive: true  },
  { name: 'Silver / US Dollar', symbol: 'XAGUSD', category: 'Metal', value: 28.4125, change: -0.1821, changePercent: -0.64, isPositive: false },
]

const TIMEFRAMES = ['1D', '1M', '3M', '1Y', '5Y', 'All'] as const

// ── sparkline (unused here but kept for parity if needed) ────────────────────

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

// ── pair card ────────────────────────────────────────────────────────────────

function PairCard({
  asset,
  selected,
  onClick,
  index,
}: {
  asset: ForexAsset
  selected: boolean
  onClick: () => void
  index: number
}) {
  const decimals = asset.symbol.includes('JPY') ? 3 : 4
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
          {asset.value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
          <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>
            {asset.symbol.slice(3)}
          </span>
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

// ── watchlist row ────────────────────────────────────────────────────────────

function WatchRow({ asset, selected, onClick }: { asset: ForexAsset; selected?: boolean; onClick?: () => void }) {
  const decimals = asset.symbol.includes('JPY') ? 3 : asset.value >= 100 ? 2 : 4
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
          {asset.displaySymbol ?? asset.symbol}
        </span>
      </div>
      <span className="ticker-mono text-[11px] tabular-nums text-right" style={{ color: 'var(--foreground)' }}>
        {asset.value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
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

// ── main page ────────────────────────────────────────────────────────────────

export default function ForexPage() {
  const [selectedAsset, setSelectedAsset] = useState<ForexAsset>(MAJORS[0])
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1D')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
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
  }, [selectedAsset.symbol])

  const watchSections = [
    { label: 'MAJORS',  items: MAJORS },
    { label: 'MINORS',  items: MINORS },
    { label: 'EXOTICS', items: EXOTICS },
    { label: 'METALS',  items: METALS },
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
            Forex, everywhere{' '}
            <ChevronDown className="inline-block" size={40} style={{ color: 'var(--text-secondary)' }} />
          </motion.h1>
        </div>

        {/* Major pairs */}
        <div className="max-w-6xl mx-auto px-8 pb-6">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Major pairs <ChevronRight size={20} className="mt-1" />
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {MAJORS.map((asset, i) => (
              <PairCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Minor pairs */}
        <div className="max-w-6xl mx-auto px-8 pb-6">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Minor pairs <ChevronRight size={20} className="mt-1" />
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {MINORS.map((asset, i) => (
              <PairCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          <motion.div
            key={selectedAsset.symbol}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--panel)' }}
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center gap-3">
                <AssetBadge symbol={selectedAsset.symbol} size={36} />
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{selectedAsset.name}</p>
                  <p className="font-bold text-lg tabular-nums" style={{ color: 'var(--foreground)' }}>
                    {selectedAsset.value.toLocaleString('en-US', {
                      minimumFractionDigits: selectedAsset.symbol.includes('JPY') ? 3 : 4,
                      maximumFractionDigits: selectedAsset.symbol.includes('JPY') ? 3 : 5,
                    })}
                  </p>
                </div>
              </div>
              <span
                className="ticker-mono text-sm font-semibold"
                style={{ color: selectedAsset.isPositive ? 'var(--green)' : 'var(--red)' }}
              >
                {selectedAsset.isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
              </span>
            </div>

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

        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Symbol</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)' }}>Last</span>
          <span className="text-[10px] text-right" style={{ color: 'var(--text-secondary)', minWidth: 48 }}>Chg%</span>
        </div>

        <div className="flex flex-col pb-4">
          {watchSections.map(section => (
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
                  selected={selectedAsset.symbol === asset.symbol}
                  onClick={() => setSelectedAsset(asset)}
                />
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
