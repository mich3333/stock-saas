'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeStocks, RealtimePrice as RealtimePriceData } from '@/hooks/useRealtimeStocks'

interface RealtimePriceProps {
  symbols: string[]
  className?: string
}

function PriceTicker({ data }: { data: RealtimePriceData }) {
  const prevPrice = useRef(data.regularMarketPrice)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)

  useEffect(() => {
    if (data.regularMarketPrice !== prevPrice.current) {
      setFlash(data.regularMarketPrice > prevPrice.current ? 'green' : 'red')
      prevPrice.current = data.regularMarketPrice
      const t = setTimeout(() => setFlash(null), 600)
      return () => clearTimeout(t)
    }
  }, [data.regularMarketPrice])

  const isPositive = data.regularMarketChange >= 0

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-300 ${
        flash === 'green'
          ? 'bg-emerald-500/20'
          : flash === 'red'
            ? 'bg-red-500/20'
            : 'bg-transparent'
      }`}
    >
      <div className="min-w-[60px]">
        <span className="text-xs font-semibold text-slate-300">{data.symbol}</span>
      </div>
      <div className="text-sm font-mono font-medium text-white">
        ${data.regularMarketPrice.toFixed(2)}
      </div>
      <div
        className={`text-xs font-mono ${
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {isPositive ? '+' : ''}
        {data.regularMarketChange.toFixed(2)} ({isPositive ? '+' : ''}
        {data.regularMarketChangePercent.toFixed(2)}%)
      </div>
    </div>
  )
}

export default function RealtimePrice({ symbols, className = '' }: RealtimePriceProps) {
  const { prices, connected } = useRealtimeStocks(symbols)

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}
        />
        <span className="text-xs text-slate-500">
          {connected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>
      <div className="space-y-1">
        {symbols.map((symbol) => {
          const data = prices[symbol]
          if (!data) {
            return (
              <div key={symbol} className="flex items-center gap-3 px-3 py-2">
                <span className="text-xs text-slate-500">{symbol}</span>
                <span className="text-xs text-slate-600">Loading...</span>
              </div>
            )
          }
          return <PriceTicker key={symbol} data={data} />
        })}
      </div>
    </div>
  )
}
