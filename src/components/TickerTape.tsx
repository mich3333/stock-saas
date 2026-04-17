'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const FALLBACK = [
  { symbol: 'AAPL', price: '189.30', change: '+1.25%', positive: true },
  { symbol: 'TSLA', price: '248.50', change: '+4.52%', positive: true },
  { symbol: 'GOOGL', price: '175.42', change: '-0.38%', positive: false },
  { symbol: 'MSFT', price: '415.20', change: '+2.10%', positive: true },
  { symbol: 'NVDA', price: '875.40', change: '+3.67%', positive: true },
  { symbol: 'AMZN', price: '185.15', change: '-0.72%', positive: false },
  { symbol: 'BTC', price: '67,420', change: '+3.14%', positive: true },
  { symbol: 'ETH', price: '3,521', change: '-1.05%', positive: false },
  { symbol: 'GOLD', price: '2,188.40', change: '+0.45%', positive: true },
  { symbol: 'SILVER', price: '24.73', change: '-0.72%', positive: false },
  { symbol: 'OIL', price: '78.61', change: '+1.21%', positive: true },
  { symbol: 'NATGAS', price: '1.84', change: '-2.13%', positive: false },
  { symbol: 'DXY', price: '103.82', change: '+0.16%', positive: true },
  { symbol: 'US10Y', price: '4.12', change: '-0.24%', positive: false },
  { symbol: 'SPY', price: '521.30', change: '+0.84%', positive: true },
  { symbol: 'QQQ', price: '447.60', change: '+1.22%', positive: true },
]

type Ticker = { symbol: string; price: string; change: string; positive: boolean }

function TickerItem({ symbol, price, change, positive }: Ticker) {
  return (
    <Link
      href={`/screener?q=${symbol}`}
      className="ticker-mono flex items-center gap-2 px-4 py-0 flex-shrink-0 hover:opacity-80 transition-opacity"
      style={{ textDecoration: 'none' }}
    >
      <span className="font-semibold text-xs text-[var(--foreground)]">{symbol}</span>
      <span className="text-xs text-[var(--text-secondary)]">{price}</span>
      <span className="text-xs font-medium" style={{ color: positive ? 'var(--green)' : 'var(--red)' }}>{change}</span>
      <span className="text-xs text-[var(--border-strong)]">|</span>
    </Link>
  )
}

export default function TickerTape() {
  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK)

  useEffect(() => {
    const es = new EventSource('/api/ticker')

    es.addEventListener('ticker', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data) && data.length > 0) setTickers(data)
      } catch {
        // keep fallback
      }
    })

    es.onerror = () => {
      // EventSource auto-reconnects; we just silently wait
    }

    return () => {
      es.close()
    }
  }, [])

  const doubled = [...tickers, ...tickers]

  return (
    <div
      className="w-full overflow-hidden flex items-center h-11 flex-shrink-0 border-b border-[var(--border)] bg-[color:var(--panel-strong)]"
    >
      <div className="ticker-scroll flex items-center">
        {doubled.map((ticker, i) => (
          <TickerItem key={`${ticker.symbol}-${i}`} {...ticker} />
        ))}
      </div>
    </div>
  )
}
