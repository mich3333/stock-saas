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
  { symbol: 'META', price: '492.80', change: '+1.89%', positive: true },
  { symbol: 'BTC', price: '67,420', change: '+3.14%', positive: true },
  { symbol: 'ETH', price: '3,521', change: '-1.05%', positive: false },
  { symbol: 'SPY', price: '521.30', change: '+0.84%', positive: true },
  { symbol: 'QQQ', price: '447.60', change: '+1.22%', positive: true },
  { symbol: 'AMD', price: '178.90', change: '-2.11%', positive: false },
  { symbol: 'NFLX', price: '628.40', change: '+0.95%', positive: true },
  { symbol: 'DIS', price: '112.30', change: '-0.43%', positive: false },
  { symbol: 'JPM', price: '198.70', change: '+0.61%', positive: true },
]

type Ticker = { symbol: string; price: string; change: string; positive: boolean }

function TickerItem({ symbol, price, change, positive }: Ticker) {
  return (
    <Link
      href={`/screener?q=${symbol}`}
      className="flex items-center gap-2 px-4 py-0 flex-shrink-0 hover:opacity-80 transition-opacity"
      style={{ textDecoration: 'none' }}
    >
      <span className="font-semibold text-xs" style={{ color: '#D1D4DC' }}>{symbol}</span>
      <span className="text-xs" style={{ color: '#787B86' }}>{price}</span>
      <span className="text-xs font-medium" style={{ color: positive ? '#26A69A' : '#EF5350' }}>{change}</span>
      <span className="text-xs" style={{ color: '#2A2E39' }}>|</span>
    </Link>
  )
}

export default function TickerTape() {
  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK)

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/ticker')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) setTickers(data)
        }
      } catch {
        // keep fallback
      }
    }
    fetchTickers()
    // refresh every 60 seconds
    const interval = setInterval(fetchTickers, 60_000)
    return () => clearInterval(interval)
  }, [])

  const doubled = [...tickers, ...tickers]

  return (
    <div
      className="w-full overflow-hidden flex items-center h-8 flex-shrink-0"
      style={{ backgroundColor: '#1E222D', borderBottom: '1px solid #2A2E39' }}
    >
      <div className="ticker-scroll flex items-center">
        {doubled.map((ticker, i) => (
          <TickerItem key={`${ticker.symbol}-${i}`} {...ticker} />
        ))}
      </div>
    </div>
  )
}
