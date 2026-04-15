'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, Plus, Grid3X3, MoreHorizontal } from 'lucide-react'
import { StockChart } from '@/components/charts/stock-chart'
import type { ChartPoint } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface CryptoAsset {
  name: string
  symbol: string
  displaySymbol?: string
  category: string
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
  'BTC-USD':  { badge: '₿',  color: '#f59e0b' },
  'ETH-USD':  { badge: 'Ξ',  color: '#6366f1' },
  'SOL-USD':  { badge: 'S',  color: '#9333ea' },
  'XRP-USD':  { badge: 'X',  color: '#2563eb' },
  'ADA-USD':  { badge: 'A',  color: '#0ea5e9' },
  'DOGE-USD': { badge: 'Ð',  color: '#eab308' },
  'UNI-USD':  { badge: 'U',  color: '#ec4899' },
  'AAVE-USD': { badge: 'Aa', color: '#8b5cf6', textSize: '9px' },
  'LINK-USD': { badge: 'LN', color: '#2563eb', textSize: '9px' },
  'MKR-USD':  { badge: 'M',  color: '#10b981' },
  'AVAX-USD': { badge: 'AV', color: '#dc2626', textSize: '9px' },
  'DOT-USD':  { badge: '•',  color: '#e11d48' },
  'MATIC-USD':{ badge: 'P',  color: '#7c3aed' },
  'SHIB-USD': { badge: 'SH', color: '#f97316', textSize: '9px' },
  'PEPE-USD': { badge: 'PP', color: '#16a34a', textSize: '9px' },
  'USDT-USD': { badge: '₮',  color: '#10b981' },
  'USDC-USD': { badge: '$',  color: '#2563eb' },
  'DAI-USD':  { badge: 'D',  color: '#eab308' },
}

// Top coins
const TOP_COINS: CryptoAsset[] = [
  { name: 'Bitcoin',   symbol: 'BTC-USD',  displaySymbol: 'BTC',  category: 'Major',  value: 67421.55, change: 1245.12, changePercent: 1.88, isPositive: true },
  { name: 'Ethereum',  symbol: 'ETH-USD',  displaySymbol: 'ETH',  category: 'Major',  value: 3218.44,  change: 62.18,   changePercent: 1.97, isPositive: true },
  { name: 'Solana',    symbol: 'SOL-USD',  displaySymbol: 'SOL',  category: 'Layer1', value: 162.33,   change: -3.47,   changePercent: -2.09, isPositive: false },
  { name: 'XRP',       symbol: 'XRP-USD',  displaySymbol: 'XRP',  category: 'Major',  value: 0.5342,   change: 0.0062,  changePercent: 1.17, isPositive: true },
  { name: 'Cardano',   symbol: 'ADA-USD',  displaySymbol: 'ADA',  category: 'Layer1', value: 0.4583,   change: -0.0094, changePercent: -2.01, isPositive: false },
  { name: 'Dogecoin',  symbol: 'DOGE-USD', displaySymbol: 'DOGE', category: 'Meme',   value: 0.1521,   change: 0.0041,  changePercent: 2.77, isPositive: true },
]

// DeFi
const DEFI: CryptoAsset[] = [
  { name: 'Uniswap',   symbol: 'UNI-USD',  displaySymbol: 'UNI',  category: 'DeFi', value: 8.42,   change: 0.18,  changePercent: 2.18, isPositive: true },
  { name: 'Aave',      symbol: 'AAVE-USD', displaySymbol: 'AAVE', category: 'DeFi', value: 142.61, change: -2.33, changePercent: -1.61, isPositive: false },
  { name: 'Chainlink', symbol: 'LINK-USD', displaySymbol: 'LINK', category: 'DeFi', value: 14.82,  change: 0.42,  changePercent: 2.92, isPositive: true },
  { name: 'Maker',     symbol: 'MKR-USD',  displaySymbol: 'MKR',  category: 'DeFi', value: 2841.55,change: 38.12, changePercent: 1.36, isPositive: true },
]

// Watchlist sections
const WATCH_MAJOR: CryptoAsset[] = TOP_COINS.filter(c => ['BTC-USD','ETH-USD','XRP-USD'].includes(c.symbol))
const WATCH_DEFI: CryptoAsset[] = DEFI
const WATCH_LAYER1: CryptoAsset[] = [
  { name: 'Solana',     symbol: 'SOL-USD',   displaySymbol: 'SOL',   category: 'Layer1', value: 162.33, change: -3.47, changePercent: -2.09, isPositive: false },
  { name: 'Cardano',    symbol: 'ADA-USD',   displaySymbol: 'ADA',   category: 'Layer1', value: 0.4583, change: -0.0094, changePercent: -2.01, isPositive: false },
  { name: 'Avalanche',  symbol: 'AVAX-USD',  displaySymbol: 'AVAX',  category: 'Layer1', value: 36.12,  change: 0.82,  changePercent: 2.32, isPositive: true },
  { name: 'Polkadot',   symbol: 'DOT-USD',   displaySymbol: 'DOT',   category: 'Layer1', value: 7.14,   change: -0.08, changePercent: -1.11, isPositive: false },
]
const WATCH_MEMES: CryptoAsset[] = [
  { name: 'Dogecoin',   symbol: 'DOGE-USD',  displaySymbol: 'DOGE',  category: 'Meme', value: 0.1521, change: 0.0041, changePercent: 2.77, isPositive: true },
  { name: 'Shiba Inu',  symbol: 'SHIB-USD',  displaySymbol: 'SHIB',  category: 'Meme', value: 0.0000238, change: 0.0000004, changePercent: 1.72, isPositive: true },
  { name: 'Pepe',       symbol: 'PEPE-USD',  displaySymbol: 'PEPE',  category: 'Meme', value: 0.0000091, change: -0.0000002, changePercent: -2.19, isPositive: false },
]
const WATCH_STABLES: CryptoAsset[] = [
  { name: 'Tether',     symbol: 'USDT-USD',  displaySymbol: 'USDT',  category: 'Stable', value: 1.0001, change: 0.0001, changePercent: 0.01, isPositive: true },
  { name: 'USD Coin',   symbol: 'USDC-USD',  displaySymbol: 'USDC',  category: 'Stable', value: 0.9998, change: -0.0002, changePercent: -0.02, isPositive: false },
  { name: 'Dai',        symbol: 'DAI-USD',   displaySymbol: 'DAI',   category: 'Stable', value: 1.0000, change: 0.0000, changePercent: 0.00, isPositive: true },
]

const TIMEFRAMES = ['1D', '1M', '3M', '1Y', '5Y', 'All'] as const

// ── badge ─────────────────────────────────────────────────────────────────────

function AssetBadge({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const badge = BADGE_MAP[symbol]
  const color = badge?.color ?? '#64748b'
  const label = badge?.badge ?? symbol.slice(0, 2)
  const textSize = badge?.textSize ?? (size < 30 ? '9px' : size < 36 ? '10px' : '13px')
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

// ── coin card ─────────────────────────────────────────────────────────────────

function CoinCard({
  asset,
  selected,
  onClick,
  index,
}: {
  asset: CryptoAsset
  selected: boolean
  onClick: () => void
  index: number
}) {
  const decimals = asset.value < 1 ? 4 : 2
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

// ── watch row ─────────────────────────────────────────────────────────────────

function WatchRow({ asset, selected, onClick }: { asset: CryptoAsset; selected?: boolean; onClick?: () => void }) {
  const sym = asset.displaySymbol ?? asset.symbol
  const absVal = Math.abs(asset.value)
  const maxFrac = absVal < 0.001 ? 8 : absVal < 1 ? 4 : 2
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
        {asset.value.toLocaleString('en-US', { maximumFractionDigits: maxFrac })}
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

// ── page ──────────────────────────────────────────────────────────────────────

export default function CryptoPage() {
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(TOP_COINS[0])
  const [chartHistory, setChartHistory] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1D')
  const abortRef = useRef<AbortController | null>(null)

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

  const watchSections = [
    { label: 'MAJOR',       items: WATCH_MAJOR },
    { label: 'DEFI',        items: WATCH_DEFI },
    { label: 'LAYER 1',     items: WATCH_LAYER1 },
    { label: 'MEMES',       items: WATCH_MEMES },
    { label: 'STABLECOINS', items: WATCH_STABLES },
  ]

  const allSelectable: Record<string, CryptoAsset> = {}
  ;[...TOP_COINS, ...DEFI, ...WATCH_LAYER1, ...WATCH_MEMES, ...WATCH_STABLES].forEach(c => {
    allSelectable[c.symbol] = c
  })

  return (
    <div className="flex h-full min-h-screen">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-8 pt-14 pb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-tv)' }}
          >
            Crypto, everywhere{' '}
            <ChevronDown className="inline-block" size={40} style={{ color: 'var(--text-secondary)' }} />
          </motion.h1>
        </div>

        {/* Top coins */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            Top coins <ChevronRight size={20} className="mt-1" />
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {TOP_COINS.map((asset, i) => (
              <CoinCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset?.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>

          {/* Chart */}
          {selectedAsset && (
            <motion.div
              key={selectedAsset.symbol}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--border)] overflow-hidden mb-8"
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
          )}

          {/* DeFi */}
          <motion.h2
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 flex items-center gap-1 cursor-pointer hover:opacity-70"
            style={{ color: 'var(--foreground)' }}
          >
            DeFi <ChevronRight size={20} className="mt-1" />
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {DEFI.map((asset, i) => (
              <CoinCard
                key={asset.symbol}
                asset={asset}
                selected={selectedAsset?.symbol === asset.symbol}
                onClick={() => setSelectedAsset(asset)}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right watchlist sidebar */}
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
                    onClick={() => {
                      const target = allSelectable[asset.symbol] ?? asset
                      setSelectedAsset(target)
                    }}
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
