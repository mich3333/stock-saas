'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Share2, BarChart2, Check, ChevronRight } from 'lucide-react'
import type { AssetType, SymbolQuote } from '@/types/symbol'

const STORAGE_KEY = 'stockflow:watchlist:tv'

const ROUTE_TO_TV_SYMBOL: Record<string, string> = {
  SPX: 'SP:SPX',
  NDQ: 'PEPPERSTONE:NDQ',
  DJI: 'DJ:DJI',
  VIX: 'CBOE:VIX',
  DXY: 'TVC:DXY',
  AAPL: 'NASDAQ:AAPL',
  TSLA: 'NASDAQ:TSLA',
  NFLX: 'NASDAQ:NFLX',
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  EURUSD: 'FX:EURUSD',
  GBPUSD: 'FX:GBPUSD',
  USDJPY: 'FX_IDC:USDJPY',
  'CL1!': 'TVC:USOIL',
  GOLD: 'TVC:GOLD',
  SILVER: 'TVC:SILVER',
}

function fmt(n: number | null, decimals = 2, prefix = "") {
  if (n === null || n === 0) return "—"
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function fmtVol(n: number) {
  if (!n) return "—"
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  open: { color: '#26a69a', label: 'Market Open' },
  closed: { color: '#787b86', label: 'Market Closed' },
  pre: { color: '#f59e0b', label: 'Pre-market' },
  after: { color: '#f59e0b', label: 'After-hours' },
}

function getCrumbs(type: AssetType, exchange: string) {
  switch (type) {
    case 'crypto':
      return ['Markets', 'Crypto', exchange || 'Spot']
    case 'index':
      return ['Markets', 'Indices', exchange || 'Global']
    case 'forex':
      return ['Markets', 'Forex', exchange || 'Majors']
    case 'futures':
      return ['Markets', 'Futures', exchange || 'Contracts']
    case 'bond':
      return ['Markets', 'Bonds', exchange || 'Sovereign']
    case 'etf':
      return ['Markets', 'ETFs', exchange || 'Funds']
    default:
      return ['Markets', exchange === 'NASDAQ' || exchange === 'NYSE' ? 'USA' : 'Global', 'Stocks']
  }
}

function getStatItems(quote: SymbolQuote) {
  const common = [
    { label: 'Open', value: quote.open.toFixed(2) },
    { label: 'High', value: quote.high.toFixed(2), color: '#26a69a' },
    { label: 'Low', value: quote.low.toFixed(2), color: '#ef5350' },
    { label: 'Prev Close', value: quote.prevClose.toFixed(2) },
  ]

  if (quote.type === 'stock' || quote.type === 'etf') {
    return [
      ...common,
      { label: 'Volume', value: fmtVol(quote.volume) },
      { label: 'Avg Vol', value: fmtVol(quote.avgVolume) },
      { label: 'Mkt Cap', value: fmt(quote.marketCap, 2, '$') },
    ]
  }

  if (quote.type === 'crypto') {
    return [
      ...common,
      { label: '24h Vol', value: fmtVol(quote.volume) },
      { label: '30d Avg', value: fmtVol(quote.avgVolume) },
      { label: 'Market Cap', value: fmt(quote.marketCap, 2, '$') },
    ]
  }

  return [
    ...common,
    { label: 'Session Vol', value: fmtVol(quote.volume) },
    { label: 'Avg Range', value: fmtVol(quote.avgVolume) },
    { label: 'Currency', value: quote.currency },
  ]
}

interface Props {
  quote: SymbolQuote
}

export function SymbolHeader({ quote }: Props) {
  const router = useRouter()
  const [inWatchlist, setInWatchlist] = useState(false)
  const isPos = quote.change >= 0
  const status = STATUS_STYLES[quote.marketStatus] ?? STATUS_STYLES.closed
  const crumbs = useMemo(() => getCrumbs(quote.type, quote.exchange), [quote.type, quote.exchange])
  const statItems = useMemo(() => getStatItems(quote), [quote])
  const tvSymbol = useMemo(() => ROUTE_TO_TV_SYMBOL[quote.symbol] ?? quote.symbol, [quote.symbol])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncWatchlistState = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        setInWatchlist(Array.isArray(parsed) && parsed.includes(tvSymbol))
      } catch {
        setInWatchlist(false)
      }
    }

    syncWatchlistState()
    window.addEventListener('storage', syncWatchlistState)
    window.addEventListener('stockflow:watchlist-updated', syncWatchlistState as EventListener)

    return () => {
      window.removeEventListener('storage', syncWatchlistState)
      window.removeEventListener('stockflow:watchlist-updated', syncWatchlistState as EventListener)
    }
  }, [tvSymbol])

  function handleWatchlistToggle() {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const current = raw ? JSON.parse(raw) : []
      const list = Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string') : []
      const next = inWatchlist ? list.filter((item) => item !== tvSymbol) : Array.from(new Set([...list, tvSymbol]))

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('stockflow:watchlist-updated', { detail: { symbols: next } }))
      setInWatchlist(!inWatchlist)
    } catch {
      // Ignore write failures and keep the page interactive.
    }
  }

  function handleAlertClick() {
    router.push(`/alerts?symbol=${encodeURIComponent(quote.symbol)}`)
  }

  return (
    <div className="border-b px-5 py-4" style={{ background: '#1b1f2a', borderColor: '#2a2e39' }}>
      <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]" style={{ color: '#787b86' }}>
        {crumbs.map((crumb, index) => (
          <div key={crumb} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={11} />}
            <span>{crumb}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 font-bold text-[13px]"
            style={{ background: 'rgba(41,98,255,0.15)', color: '#2962ff', border: '1px solid rgba(41,98,255,0.3)' }}
          >
            {quote.symbol.slice(0, 4)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[28px] font-bold leading-none" style={{ color: '#f8fafc' }}>{quote.name}</span>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[13px] font-semibold" style={{ color: '#d1d4dc' }}>{quote.symbol}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#2a2e39', color: '#787b86' }}>{quote.exchange}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#2a2e39', color: '#787b86' }}>{quote.type.toUpperCase()}</span>
              <span className="flex items-center gap-1.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                <span className="text-[11px]" style={{ color: '#787b86' }}>{status.label}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap mt-1">
              <span className="text-[40px] font-bold tabular-nums leading-none" style={{ color: '#f8fafc' }}>
                {quote.price.toFixed(2)}
              </span>
              <span className="text-[12px] tabular-nums" style={{ color: '#787b86' }}>{quote.currency}</span>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: isPos ? '#26a69a' : '#ef5350' }}>
                {isPos ? '+' : ''}{quote.change.toFixed(2)}
              </span>
              <span
                className="text-[12px] font-medium tabular-nums px-1.5 py-0.5 rounded"
                style={{
                  color: isPos ? '#26a69a' : '#ef5350',
                  background: isPos ? 'rgba(38,166,154,0.1)' : 'rgba(239,83,80,0.1)',
                }}
              >
                {isPos ? '+' : ''}{quote.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleWatchlistToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors border"
            style={
              inWatchlist
                ? { background: 'rgba(41,98,255,0.15)', color: '#2962ff', borderColor: '#2962ff' }
                : { background: 'transparent', color: '#787b86', borderColor: '#2a2e39' }
            }
          >
            {inWatchlist ? <Check size={12} /> : <Plus size={12} />}
            {inWatchlist ? 'Watching' : 'Watchlist'}
          </button>
          <button
            onClick={handleAlertClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors"
            style={{ background: 'transparent', color: '#787b86', borderColor: '#2a2e39' }}
          >
            <Bell size={12} />
            Alert
          </button>
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors" style={{ background: 'transparent', color: '#787b86', borderColor: '#2a2e39' }}>
            <BarChart2 size={12} />
            Compare
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded border transition-colors" style={{ background: 'transparent', color: '#787b86', borderColor: '#2a2e39' }}>
            <Share2 size={12} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-x-6 gap-y-2 flex-wrap">
        {statItems.map(item => (
          <StatItem key={item.label} label={item.label} value={item.value} color={item.color} />
        ))}
      </div>
    </div>
  )
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide" style={{ color: '#787b86' }}>{label}</span>
      <span className="text-[12px] font-medium tabular-nums" style={{ color: color ?? '#d1d4dc' }}>{value}</span>
    </div>
  )
}
