'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Grid3X3, MoreHorizontal } from 'lucide-react'
import { StockChart } from '@/components/charts/stock-chart'
import type { ChartPoint } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface StockAsset {
  name: string
  symbol: string
  sector: string
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
  AAPL:  { badge: 'AA', color: '#111827' },
  NVDA:  { badge: 'NV', color: '#16a34a' },
  MSFT:  { badge: 'MS', color: '#2563eb' },
  TSLA:  { badge: 'TS', color: '#dc2626' },
  META:  { badge: 'ME', color: '#0ea5e9' },
  GOOGL: { badge: 'GO', color: '#f59e0b' },
  AMZN:  { badge: 'AM', color: '#f97316' },
  NFLX:  { badge: 'NF', color: '#dc2626' },
  INTC:  { badge: 'IN', color: '#0284c7' },
  AMD:   { badge: 'AM', color: '#ef4444' },
  JNJ:   { badge: 'JN', color: '#e11d48' },
  PFE:   { badge: 'PF', color: '#2563eb' },
  UNH:   { badge: 'UN', color: '#0ea5e9' },
  LLY:   { badge: 'LL', color: '#7c3aed' },
  JPM:   { badge: 'JP', color: '#1e3a8a' },
  BAC:   { badge: 'BA', color: '#991b1b' },
  GS:    { badge: 'GS', color: '#0f172a' },
  V:     { badge: 'V',  color: '#1d4ed8' },
  XOM:   { badge: 'XO', color: '#dc2626' },
  CVX:   { badge: 'CV', color: '#2563eb' },
  COP:   { badge: 'CO', color: '#ea580c' },
  KO:    { badge: 'KO', color: '#dc2626' },
  PEP:   { badge: 'PE', color: '#2563eb' },
  WMT:   { badge: 'WM', color: '#1d4ed8' },
  NKE:   { badge: 'NK', color: '#111827' },
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#2563eb',
  Healthcare: '#e11d48',
  Finance:    '#0f172a',
  Energy:     '#ea580c',
  Consumer:   '#16a34a',
}

const TOP_GAINERS: StockAsset[] = [
  { name: 'Apple Inc',       symbol: 'AAPL',  sector: 'Technology', value: 265.68, change: 6.85,  changePercent: 2.65, isPositive: true },
  { name: 'Nvidia Corp',     symbol: 'NVDA',  sector: 'Technology', value: 512.34, change: 18.24, changePercent: 3.69, isPositive: true },
  { name: 'Microsoft Corp',  symbol: 'MSFT',  sector: 'Technology', value: 428.10, change: 9.12,  changePercent: 2.18, isPositive: true },
  { name: 'Tesla Inc',       symbol: 'TSLA',  sector: 'Consumer',   value: 390.92, change: 26.72, changePercent: 7.34, isPositive: true },
  { name: 'Meta Platforms',  symbol: 'META',  sector: 'Technology', value: 598.45, change: 11.07, changePercent: 1.88, isPositive: true },
  { name: 'Alphabet Inc',    symbol: 'GOOGL', sector: 'Technology', value: 181.22, change: 3.48,  changePercent: 1.96, isPositive: true },
]

const TOP_LOSERS: StockAsset[] = [
  { name: 'Intel Corp',       symbol: 'INTC', sector: 'Technology', value: 22.13,  change: -0.78, changePercent: -3.41, isPositive: false },
  { name: 'Pfizer Inc',       symbol: 'PFE',  sector: 'Healthcare', value: 27.02,  change: -0.65, changePercent: -2.35, isPositive: false },
  { name: 'Exxon Mobil',      symbol: 'XOM',  sector: 'Energy',     value: 112.48, change: -2.11, changePercent: -1.84, isPositive: false },
  { name: 'Bank of America',  symbol: 'BAC',  sector: 'Finance',    value: 41.87,  change: -0.62, changePercent: -1.46, isPositive: false },
]

const WATCHLIST: Record<string, StockAsset[]> = {
  TECHNOLOGY: [
    { name: 'Apple Inc',      symbol: 'AAPL',  sector: 'Technology', value: 265.68, change: 6.85,  changePercent: 2.65, isPositive: true },
    { name: 'Nvidia Corp',    symbol: 'NVDA',  sector: 'Technology', value: 512.34, change: 18.24, changePercent: 3.69, isPositive: true },
    { name: 'Microsoft Corp', symbol: 'MSFT',  sector: 'Technology', value: 428.10, change: 9.12,  changePercent: 2.18, isPositive: true },
    { name: 'Meta Platforms', symbol: 'META',  sector: 'Technology', value: 598.45, change: 11.07, changePercent: 1.88, isPositive: true },
    { name: 'Alphabet Inc',   symbol: 'GOOGL', sector: 'Technology', value: 181.22, change: 3.48,  changePercent: 1.96, isPositive: true },
    { name: 'Intel Corp',     symbol: 'INTC',  sector: 'Technology', value: 22.13,  change: -0.78, changePercent: -3.41, isPositive: false },
    { name: 'AMD',            symbol: 'AMD',   sector: 'Technology', value: 148.72, change: 2.04,  changePercent: 1.39, isPositive: true },
  ],
  HEALTHCARE: [
    { name: 'Johnson & Johnson', symbol: 'JNJ', sector: 'Healthcare', value: 162.45, change: 0.92, changePercent: 0.57, isPositive: true },
    { name: 'Pfizer Inc',        symbol: 'PFE', sector: 'Healthcare', value: 27.02,  change: -0.65, changePercent: -2.35, isPositive: false },
    { name: 'UnitedHealth',      symbol: 'UNH', sector: 'Healthcare', value: 512.10, change: 4.24,  changePercent: 0.84, isPositive: true },
    { name: 'Eli Lilly',         symbol: 'LLY', sector: 'Healthcare', value: 802.33, change: -3.11, changePercent: -0.39, isPositive: false },
  ],
  FINANCE: [
    { name: 'JPMorgan Chase',   symbol: 'JPM', sector: 'Finance', value: 218.54, change: 1.78, changePercent: 0.82, isPositive: true },
    { name: 'Bank of America',  symbol: 'BAC', sector: 'Finance', value: 41.87,  change: -0.62, changePercent: -1.46, isPositive: false },
    { name: 'Goldman Sachs',    symbol: 'GS',  sector: 'Finance', value: 512.09, change: 3.14,  changePercent: 0.62, isPositive: true },
    { name: 'Visa Inc',         symbol: 'V',   sector: 'Finance', value: 298.44, change: 1.02,  changePercent: 0.34, isPositive: true },
  ],
  ENERGY: [
    { name: 'Exxon Mobil',    symbol: 'XOM', sector: 'Energy', value: 112.48, change: -2.11, changePercent: -1.84, isPositive: false },
    { name: 'Chevron Corp',   symbol: 'CVX', sector: 'Energy', value: 148.33, change: -0.88, changePercent: -0.59, isPositive: false },
    { name: 'ConocoPhillips', symbol: 'COP', sector: 'Energy', value: 108.27, change: 0.45,  changePercent: 0.42, isPositive: true },
  ],
  CONSUMER: [
    { name: 'Tesla Inc',      symbol: 'TSLA', sector: 'Consumer', value: 390.92, change: 26.72, changePercent: 7.34, isPositive: true },
    { name: 'Coca-Cola',      symbol: 'KO',   sector: 'Consumer', value: 69.14,  change: 0.28,  changePercent: 0.41, isPositive: true },
    { name: 'PepsiCo Inc',    symbol: 'PEP',  sector: 'Consumer', value: 162.77, change: -0.54, changePercent: -0.33, isPositive: false },
    { name: 'Walmart Inc',    symbol: 'WMT',  sector: 'Consumer', value: 98.10,  change: 1.12,  changePercent: 1.15, isPositive: true },
    { name: 'Nike Inc',       symbol: 'NKE',  sector: 'Consumer', value: 78.55,  change: -0.30, changePercent: -0.38, isPositive: false },
  ],
}

const TIMEFRAMES = ['1D', '1M', '3M', '1Y', '5Y', 'All'] as const

// ── badge ─────────────────────────────────────────────────────────────────────

function StockBadge({ asset, size = 40 }: { asset: StockAsset; size?: number }) {
  const mapped = BADGE_MAP[asset.symbol]
  const color = mapped?.color ?? SECTOR_COLORS[asset.sector] ?? '#64748b'
  const label = asset.symbol.slice(0, 2)
  const textSize = size < 24 ? '9px' : size < 36 ? '10px' : '11px'
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

// ── horizontal stock card ────────────────────────────────────────────────────

function StockCard({
  asset,
  selected,
  onClick,
  index,
}: {
  asset: StockAsset
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
      <StockBadge asset={asset} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
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

function WatchRow({ asset, selected, onClick }: { asset: StockAsset; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-1.5 text-left transition-colors ${
        selected ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--panel-muted)]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <StockBadge asset={asset} size={18} />
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {asset.symbol}
        </span>
      </div>
      <span className="ticker-mono text-[11px] tabular-nums text-right" style={{ color: 'var(--foreground)' }}>
        {asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
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

export default function StocksPage() {
  const [selectedAsset, setSelectedAsset] = useState<StockAsset>(TOP_GAINERS[0])
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
            Stocks, everywhere{' '}
            <ChevronDown className="inline-block" size={40} style={{ color: 'var(--text-secondary)' }} />
          </motion.h1>
        </div>

        {/* Top gainers */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Top gainers <ChevronRight size={20} className="mt-1" />
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {TOP_GAINERS.map((asset, i) => (
              <StockCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>

          {/* Top losers */}
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Top losers <ChevronRight size={20} className="mt-1" />
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {TOP_LOSERS.map((asset, i) => (
              <StockCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>

          {/* Chart */}
          <motion.div
            key={selectedAsset.symbol}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: 'var(--panel)' }}
          >
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
          {Object.entries(WATCHLIST).map(([label, items]) => (
            <div key={label}>
              <div
                className="flex items-center gap-1 px-3 py-1.5 mt-2 cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronDown size={10} />
                <p className="text-[10px] font-bold tracking-widest">{label}</p>
              </div>
              {items.map(asset => (
                <WatchRow
                  key={`${label}-${asset.symbol}`}
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
