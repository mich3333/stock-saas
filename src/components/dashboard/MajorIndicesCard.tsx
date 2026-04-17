'use client'

import { useEffect, useState } from 'react'

type IndexRow = {
  key: string
  name: string
  ticker: string
  symbol: string
  value: number | null
  change: number | null
  changePercent: number | null
}

const INDICES: Omit<IndexRow, 'value' | 'change' | 'changePercent'>[] = [
  { key: 'SPX', name: 'S&P 500', ticker: 'SPX', symbol: '^GSPC' },
  { key: 'NDQ', name: 'Nasdaq 100', ticker: 'NDQ', symbol: '^NDX' },
  { key: 'DJI', name: 'Dow Jones', ticker: 'DJI', symbol: '^DJI' },
  { key: 'VIX', name: 'Volatility Index', ticker: 'VIX', symbol: '^VIX' },
]

const POSITIVE = '#26a69a'
const NEGATIVE = '#ef5350'

const YAHOO_URL =
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=^GSPC,^NDX,^DJI,^VIX'

function formatValue(v: number | null): string {
  if (v === null || !isFinite(v)) return '—'
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatChange(v: number | null): string {
  if (v === null || !isFinite(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPercent(v: number | null): string {
  if (v === null || !isFinite(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

export default function MajorIndicesCard() {
  const [rows, setRows] = useState<IndexRow[]>(
    INDICES.map((i) => ({ ...i, value: null, change: null, changePercent: null }))
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Try Yahoo directly first (covers VIX)
        const res = await fetch(YAHOO_URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const json = await res.json()
        const quotes: any[] = json?.quoteResponse?.result ?? []
        if (!Array.isArray(quotes) || quotes.length === 0) {
          throw new Error('empty response')
        }
        const bySymbol = new Map<string, any>(
          quotes.map((q) => [q.symbol, q])
        )
        const next: IndexRow[] = INDICES.map((i) => {
          const q = bySymbol.get(i.symbol)
          return {
            ...i,
            value: q?.regularMarketPrice ?? null,
            change: q?.regularMarketChange ?? null,
            changePercent: q?.regularMarketChangePercent ?? null,
          }
        })
        if (!cancelled) {
          setRows(next)
          setLoading(false)
        }
      } catch {
        // Fall back to internal /api/indices (no VIX; leaves it as —)
        try {
          const res = await fetch('/api/indices', { cache: 'no-store' })
          if (!res.ok) throw new Error('indices api failed')
          const json = await res.json()
          const data: any[] = json?.indices ?? []
          const bySymbol = new Map<string, any>(data.map((d) => [d.symbol, d]))
          const next: IndexRow[] = INDICES.map((i) => {
            const q = bySymbol.get(i.symbol)
            return {
              ...i,
              value: q?.value ?? null,
              change: q?.change ?? null,
              changePercent: q?.changePercent ?? null,
            }
          })
          if (!cancelled) {
            setRows(next)
            setLoading(false)
          }
        } catch {
          if (!cancelled) setLoading(false)
        }
      }
    }

    load()
    const id = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
    >
      <div
        className="px-4 py-3 text-sm font-semibold text-white"
        style={{ borderBottom: '1px solid #2a2e39' }}
      >
        Major indices
      </div>
      <div className="divide-y" style={{ borderColor: '#2a2e39' }}>
        {rows.map((r) => {
          const isLoading = loading && r.value === null
          const isPos = (r.change ?? 0) >= 0
          const color = r.change === null ? '#9ca3af' : isPos ? POSITIVE : NEGATIVE

          return (
            <div
              key={r.key}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid #2a2e39' }}
            >
              <div className="flex flex-col min-w-0">
                {isLoading ? (
                  <>
                    <div className="h-3 w-24 rounded bg-[#2a2e39] animate-pulse mb-1.5" />
                    <div className="h-2.5 w-10 rounded bg-[#2a2e39] animate-pulse" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-white truncate">{r.name}</span>
                    <span className="text-xs text-gray-400">{r.ticker}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-right tabular-nums">
                {isLoading ? (
                  <>
                    <div className="h-3 w-16 rounded bg-[#2a2e39] animate-pulse" />
                    <div className="h-3 w-14 rounded bg-[#2a2e39] animate-pulse" />
                    <div className="h-3 w-12 rounded bg-[#2a2e39] animate-pulse" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-white w-24">
                      {formatValue(r.value)}
                    </span>
                    <span className="text-sm w-20" style={{ color }}>
                      {formatChange(r.change)}
                    </span>
                    <span className="text-sm w-16" style={{ color }}>
                      {formatPercent(r.changePercent)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
