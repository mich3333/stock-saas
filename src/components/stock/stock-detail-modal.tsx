'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StockChart } from '@/components/charts/stock-chart'
import type { QuoteData, ChartPoint } from '@/types'

// ─── Static market sidebar data ──────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  {
    category: 'INDICES',
    items: [
      { symbol: 'SPX', name: 'S&P 500' },
      { symbol: 'NDQ', name: 'Nasdaq 100' },
      { symbol: 'DJI', name: 'Dow 30' },
      { symbol: 'VIX', name: 'Volatility' },
      { symbol: 'DXY', name: 'Dollar Index' },
    ],
  },
  {
    category: 'STOCKS',
    items: [
      { symbol: 'AAPL', name: 'Apple' },
      { symbol: 'TSLA', name: 'Tesla' },
      { symbol: 'NFLX', name: 'Netflix' },
      { symbol: 'NVDA', name: 'NVIDIA' },
    ],
  },
  {
    category: 'FUTURES',
    items: [
      { symbol: 'USOIL', name: 'Crude Oil' },
      { symbol: 'GOLD', name: 'Gold' },
      { symbol: 'SILVER', name: 'Silver' },
    ],
  },
  {
    category: 'FOREX',
    items: [
      { symbol: 'EURUSD', name: 'EUR/USD' },
      { symbol: 'GBPUSD', name: 'GBP/USD' },
      { symbol: 'USDJPY', name: 'USD/JPY' },
    ],
  },
  {
    category: 'CRYPTO',
    items: [
      { symbol: 'BTCUSD', name: 'Bitcoin' },
      { symbol: 'ETHUSD', name: 'Ethereum' },
    ],
  },
]

// ─── Sidebar row ─────────────────────────────────────────────────────────────

interface SidebarRowProps {
  symbol: string
  name: string
  isActive: boolean
  onClick: (symbol: string) => void
}

function SidebarRow({ symbol, name, isActive, onClick }: SidebarRowProps) {
  return (
    <button
      onClick={() => onClick(symbol)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.75rem',
        background: isActive ? 'rgba(41,98,255,0.12)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderLeft: isActive ? '2px solid #2962FF' : '2px solid transparent',
        transition: 'background 0.15s',
        gap: 6,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D1D4DC', margin: 0 }}>{symbol}</p>
        <p style={{ fontSize: 9, color: '#787B86', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{name}</p>
      </div>
    </button>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'News', 'Community', 'Technicals', 'Seasonals', 'Components']

// ─── Main modal ──────────────────────────────────────────────────────────────

interface StockDetailModalProps {
  symbol: string | null
  onClose: () => void
}

export function StockDetailModal({ symbol, onClose }: StockDetailModalProps) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [history, setHistory] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSymbol, setActiveSymbol] = useState<string | null>(symbol)

  const loadSymbol = useCallback(async (sym: string) => {
    setLoading(true)
    setQuote(null)
    setHistory([])
    try {
      const res = await fetch(`/api/stocks/${sym}?history=true`)
      if (res.ok) {
        const data = await res.json()
        setQuote(data.quote ?? null)
        setHistory(data.history ?? [])
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (symbol) {
      setActiveSymbol(symbol)
      setActiveTab('Overview')
    }
  }, [symbol])

  useEffect(() => {
    if (activeSymbol) loadSymbol(activeSymbol)
  }, [activeSymbol, loadSymbol])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isPositive = (quote?.regularMarketChange ?? 0) >= 0
  const price = quote?.regularMarketPrice ?? null
  const change = quote?.regularMarketChange ?? null
  const changePct = quote?.regularMarketChangePercent ?? null
  const name = quote?.shortName ?? activeSymbol ?? ''

  const formatPrice = (v: number) =>
    v >= 1000 ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2)

  const formatLarge = (v: number | null) => {
    if (!v) return '—'
    if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
    return v.toFixed(0)
  }

  return (
    <AnimatePresence>
      {symbol && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.72)',
              zIndex: 1000,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '3%',
              left: '3%',
              right: '3%',
              bottom: '3%',
              zIndex: 1001,
              display: 'flex',
              background: '#131722',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #2A2E39',
              boxShadow: '0 32px 80px rgba(0,0,0,0.72)',
            }}
          >
            {/* ── Left: Main content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #2A2E39', flexShrink: 0 }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#787B86' }}>
                  <span>Markets</span>
                  <span>/</span>
                  <span>USA</span>
                  <span>/</span>
                  <span style={{ color: '#D1D4DC' }}>{activeSymbol}</span>
                </div>
                <button
                  onClick={onClose}
                  style={{ padding: '0.3rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#787B86', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#D1D4DC' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#787B86' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Stock info */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #2A2E39', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Symbol badge */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: isPositive ? 'rgba(38,166,154,0.18)' : 'rgba(239,83,80,0.18)',
                    border: `2px solid ${isPositive ? '#26A69A' : '#EF5350'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isPositive ? '#26A69A' : '#EF5350', textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>
                      {activeSymbol}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#D1D4DC' }}>
                      {loading ? <span style={{ opacity: 0.4 }}>Loading…</span> : name}
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#787B86' }}>
                      {activeSymbol} · US Market
                    </p>

                    {price !== null && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: '#D1D4DC', fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice(price)}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#787B86' }}>USD</span>
                        {change !== null && changePct !== null && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '1rem', fontWeight: 600, color: isPositive ? '#26A69A' : '#EF5350' }}>
                            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {isPositive ? '+' : ''}{formatPrice(change)} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta stats */}
                    {quote && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {quote.regularMarketVolume && (
                          <div style={{ fontSize: '0.72rem', color: '#787B86' }}>
                            <span style={{ color: '#9598A1', fontWeight: 600 }}>Vol </span>
                            {formatLarge(quote.regularMarketVolume)}
                          </div>
                        )}
                        {quote.marketCap && (
                          <div style={{ fontSize: '0.72rem', color: '#787B86' }}>
                            <span style={{ color: '#9598A1', fontWeight: 600 }}>Mkt Cap </span>
                            {formatLarge(quote.marketCap)}
                          </div>
                        )}
                        {quote.fiftyTwoWeekHigh && (
                          <div style={{ fontSize: '0.72rem', color: '#787B86' }}>
                            <span style={{ color: '#9598A1', fontWeight: 600 }}>52W </span>
                            {formatPrice(quote.fiftyTwoWeekLow ?? 0)} – {formatPrice(quote.fiftyTwoWeekHigh)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Open in screener */}
                  <a
                    href={`/screener?q=${activeSymbol}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#787B86', textDecoration: 'none', padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #2A2E39', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#D1D4DC'; (e.currentTarget as HTMLElement).style.borderColor = '#787B86' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#787B86'; (e.currentTarget as HTMLElement).style.borderColor = '#2A2E39' }}
                  >
                    <ExternalLink size={11} />
                    Full page
                  </a>
                </div>
              </div>

              {/* Tab navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid #2A2E39', flexShrink: 0, padding: '0 1.25rem', overflowX: 'auto' }}>
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: activeTab === tab ? '#D1D4DC' : '#787B86',
                      borderBottom: activeTab === tab ? '2px solid #2962FF' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = '#B2B5BE' }}
                    onMouseLeave={(e) => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = '#787B86' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
                {activeTab === 'Overview' && (
                  <div>
                    {/* Chart header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D1D4DC', margin: 0 }}>
                        Chart ›
                      </p>
                    </div>

                    {loading ? (
                      <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E222D', borderRadius: 8, color: '#787B86', fontSize: '0.85rem' }}>
                        Loading chart data…
                      </div>
                    ) : activeSymbol ? (
                      <StockChart
                        symbol={activeSymbol}
                        data={history}
                        isPositive={isPositive}
                      />
                    ) : null}
                  </div>
                )}

                {activeTab !== 'Overview' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#787B86', fontSize: '0.85rem', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: '2rem', opacity: 0.3 }}>📊</span>
                    <span>{activeTab} — coming soon</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Watchlist sidebar ── */}
            <div style={{ width: 220, background: '#1E222D', borderLeft: '1px solid #2A2E39', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              {/* Sidebar header */}
              <div style={{ padding: '0.65rem 0.75rem', borderBottom: '1px solid #2A2E39', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D1D4DC', letterSpacing: '0.04em' }}>Watchlist</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#787B86' }}>
                  <span>Symbol</span>
                  <span style={{ marginLeft: 18 }}>Last</span>
                  <span style={{ marginLeft: 8 }}>Chg%</span>
                </div>
              </div>

              {/* Scrollable list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {SIDEBAR_ITEMS.map(({ category, items }) => (
                  <div key={category}>
                    {/* Category header */}
                    <div style={{ padding: '0.35rem 0.75rem 0.2rem', fontSize: 9, fontWeight: 700, color: '#4A4E5A', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#131722', borderBottom: '1px solid #2A2E39' }}>
                      {category}
                    </div>
                    {items.map((item) => (
                      <SidebarRow
                        key={item.symbol}
                        symbol={item.symbol}
                        name={item.name}
                        isActive={activeSymbol === item.symbol}
                        onClick={(sym) => setActiveSymbol(sym)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Sidebar footer */}
              <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid #2A2E39', fontSize: 9, color: '#4A4E5A', textAlign: 'center' }}>
                Click any symbol to view details
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
