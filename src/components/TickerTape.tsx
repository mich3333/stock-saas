'use client'

import { useEffect, useState } from 'react'
import { StockDetailModal } from '@/components/stock/stock-detail-modal'

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

interface TickerItemProps extends Ticker {
  onClick: (symbol: string) => void
}

function TickerItem({ symbol, price, change, positive, onClick }: TickerItemProps) {
  return (
    <button
      onClick={() => onClick(symbol)}
      className="ticker-mono flex items-center gap-2 px-4 py-0 flex-shrink-0 hover:opacity-80 transition-opacity"
      style={{ textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <span className="font-semibold text-xs" style={{ color: '#d1d4dc' }}>{symbol}</span>
      <span className="text-xs" style={{ color: '#787b86' }}>{price}</span>
      <span className="text-xs font-medium" style={{ color: positive ? '#26a69a' : '#ef5350' }}>{change}</span>
      <span className="text-xs" style={{ color: '#2a2e39' }}>|</span>
    </button>
  )
}

export default function TickerTape() {
  const [mounted, setMounted] = useState(false)
  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
    })

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
      window.cancelAnimationFrame(frame)
      es.close()
    }
  }, [])

  const doubled = [...tickers, ...tickers]

  if (!mounted) {
    return <div className="w-full h-9 border-b border-[#2a2e39] bg-[#1e222d]" />
  }

  return (
    <>
      <div
        className="w-full overflow-hidden flex items-center flex-shrink-0"
        style={{ height: 36, borderBottom: '1px solid #2a2e39', background: '#1e222d' }}
      >
        <div className="ticker-scroll flex items-center">
          {doubled.map((ticker, i) => (
            <TickerItem key={`${ticker.symbol}-${i}`} {...ticker} onClick={setSelectedSymbol} />
          ))}
        </div>
      </div>

      <StockDetailModal symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
    </>
  )
}
