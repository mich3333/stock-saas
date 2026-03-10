'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface RealtimePrice {
  symbol: string
  shortName: string | null
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  marketCap: number | null
  timestamp: number
}

interface UseRealtimeStocksResult {
  prices: Record<string, RealtimePrice>
  connected: boolean
}

export function useRealtimeStocks(symbols: string[]): UseRealtimeStocksResult {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({})
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const symbolsKey = symbols.sort().join(',')

  const connect = useCallback(() => {
    if (!symbolsKey) return

    const url = `/api/stocks/stream?symbols=${encodeURIComponent(symbolsKey)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      retryCountRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimePrice
        setPrices((prev) => ({ ...prev, [data.symbol]: data }))
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
      retryCountRef.current++
      retryTimeoutRef.current = setTimeout(connect, delay)
    }
  }, [symbolsKey])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [connect])

  return { prices, connected }
}
