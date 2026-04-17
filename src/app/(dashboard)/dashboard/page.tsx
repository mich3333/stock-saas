'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StockChart } from '@/components/charts/stock-chart'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const SYMBOLS = [
  { tv: 'SPX',  yf: '^GSPC',   name: 'S&P 500',   exchange: 'INDEXSP' },
  { tv: 'NDQ',  yf: '^IXIC',   name: 'NASDAQ',     exchange: 'INDEXNASDAQ' },
  { tv: 'DJI',  yf: '^DJI',    name: 'Dow Jones',  exchange: 'INDEXDJX' },
  { tv: 'VIX',  yf: '^VIX',    name: 'Volatility', exchange: 'CBOE' },
  { tv: 'AAPL', yf: 'AAPL',    name: 'Apple',      exchange: 'NASDAQ' },
  { tv: 'TSLA', yf: 'TSLA',    name: 'Tesla',      exchange: 'NASDAQ' },
  { tv: 'NVDA', yf: 'NVDA',    name: 'NVIDIA',     exchange: 'NASDAQ' },
  { tv: 'GOLD', yf: 'GC=F',    name: 'Gold',       exchange: 'COMEX' },
  { tv: 'BTC',  yf: 'BTC-USD', name: 'Bitcoin',    exchange: 'CRYPTO' },
] as const

interface MarketData {
  value: number
  change: number
  changePercent: number
  isPositive: boolean
  volume: number
  dayHigh: number
  dayLow: number
}

type SymbolEntry = (typeof SYMBOLS)[number]

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtCompact(n: number) {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function ChartPage() {
  const router = useRouter()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [dataMap, setDataMap] = useState<Record<string, MarketData>>({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selected = SYMBOLS[selectedIdx]
  const data = dataMap[selected.yf] ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  const fetchData = useCallback(() => {
    fetch('/api/indices')
      .then(r => (r.ok ? r.json() : null))
      .then(resp => {
        if (!resp?.indices?.length) return
        const map: Record<string, MarketData> = {}
        for (const idx of resp.indices) {
          map[idx.symbol] = {
            value: idx.value,
            change: idx.change,
            changePercent: idx.changePercent,
            isPositive: idx.isPositive,
            volume: idx.volume,
            dayHigh: idx.dayHigh,
            dayLow: idx.dayLow,
          }
        }
        setDataMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60_000)
    return () => clearInterval(id)
  }, [fetchData])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const isPositive = data ? data.isPositive : true
  const green = '#26a69a'
  const red = '#ef5350'
  const color = isPositive ? green : red

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#131722' }}>
        {/* Symbol bar */}
        <div
          style={{
            height: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            paddingLeft: 16,
            paddingRight: 16,
            background: '#1e222d',
            borderBottom: '1px solid #2a2e39',
          }}
        >
          {/* Left section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {/* Symbol */}
            <span style={{ fontSize: 14, fontWeight: 700, color: '#d1d4dc', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              {selected.tv}
            </span>
            {/* Exchange */}
            <span style={{ fontSize: 11, color: '#787b86' }}>
              {selected.exchange}
            </span>
            {/* Divider */}
            <div style={{ width: 1, height: 16, background: '#2a2e39' }} />

            {data ? (
              <>
                {/* Price */}
                <span style={{ fontSize: 16, fontWeight: 700, color: '#d1d4dc', fontFamily: 'monospace' }}>
                  {fmtPrice(data.value)}
                </span>
                {/* Change abs */}
                <span style={{ fontSize: 13, color, fontFamily: 'monospace' }}>
                  {data.isPositive ? '+' : ''}{fmtPrice(Math.abs(data.change))}
                </span>
                {/* Change pct badge */}
                <span
                  style={{
                    fontSize: 13,
                    color,
                    fontFamily: 'monospace',
                    background: isPositive ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)',
                    padding: '1px 6px',
                    borderRadius: 3,
                  }}
                >
                  {data.isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
                {/* Dot */}
                <span style={{ color: '#787b86', fontSize: 11 }}>·</span>
                {/* H / L */}
                <span style={{ fontSize: 11, color: '#787b86', fontFamily: 'monospace' }}>
                  H: <span style={{ color: '#d1d4dc' }}>{fmtPrice(data.dayHigh)}</span>
                </span>
                <span style={{ fontSize: 11, color: '#787b86', fontFamily: 'monospace' }}>
                  L: <span style={{ color: '#d1d4dc' }}>{fmtPrice(data.dayLow)}</span>
                </span>
                {/* Vol */}
                <span style={{ fontSize: 11, color: '#787b86', fontFamily: 'monospace' }}>
                  Vol: <span style={{ color: '#d1d4dc' }}>{fmtCompact(data.volume)}</span>
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#787b86' }}>Loading…</span>
            )}
          </div>

          {/* Right section: symbol dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                height: 26,
                padding: '0 10px',
                background: '#131722',
                border: '1px solid #2a2e39',
                borderRadius: 3,
                color: '#d1d4dc',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {selected.tv}
              <span style={{ fontSize: 10, color: '#787b86' }}>▾</span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  width: 220,
                  background: '#1e222d',
                  border: '1px solid #2a2e39',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {SYMBOLS.map((sym, i) => (
                  <button
                    key={sym.tv}
                    onClick={() => { setSelectedIdx(i); setDropdownOpen(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '6px 10px',
                      border: 'none',
                      background: i === selectedIdx ? 'rgba(41,98,255,0.12)' : 'transparent',
                      color: '#d1d4dc',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (i !== selectedIdx) (e.currentTarget as HTMLButtonElement).style.background = '#2a2e39'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = i === selectedIdx ? 'rgba(41,98,255,0.12)' : 'transparent'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{sym.tv}</span>
                    <span style={{ fontSize: 11, color: '#787b86' }}>{sym.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <StockChart
            symbol={selected.yf}
            isPositive={isPositive}
            fillHeight
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#131722' }}>
          <div style={{ height: 40, flexShrink: 0, background: '#1e222d' }} />
          <div style={{ flex: 1 }} />
        </div>
      }
    >
      <ChartPage />
    </Suspense>
  )
}
