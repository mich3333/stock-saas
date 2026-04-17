'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { OHLCV, WebSocketMessage, Timeframe } from '@/types/market'

// Map our Timeframe type to Binance interval strings
const INTERVAL_MAP: Record<Timeframe, string> = {
  '1m':  '1m',
  '5m':  '5m',
  '15m': '15m',
  '1h':  '1h',
  '4h':  '4h',
  '1d':  '1d',
  '1w':  '1w',
}

interface UseMarketDataResult {
  data: OHLCV[]
  latestBar: OHLCV | null
  isConnected: boolean
}

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

function klineToOHLCV(k: WebSocketMessage['k']): OHLCV {
  return {
    time:   Math.floor(k.t / 1000), // ms → seconds
    open:   parseFloat(k.o),
    high:   parseFloat(k.h),
    low:    parseFloat(k.l),
    close:  parseFloat(k.c),
    volume: parseFloat(k.v),
  }
}

export function useMarketData(symbol: string, timeframe: Timeframe): UseMarketDataResult {
  const [data, setData] = useState<OHLCV[]>([])
  const [latestBar, setLatestBar] = useState<OHLCV | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Stable refs so reconnect logic doesn't capture stale closures
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    const lowerSymbol = symbol.toLowerCase()
    const interval = INTERVAL_MAP[timeframe]
    const url = `wss://stream.binance.com:9443/ws/${lowerSymbol}@kline_${interval}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!isMountedRef.current) return
      setIsConnected(true)
      retriesRef.current = 0
    }

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return
      let msg: WebSocketMessage
      try {
        msg = JSON.parse(event.data as string) as WebSocketMessage
      } catch {
        return
      }

      const kline = msg.k
      if (!kline) return

      const bar = klineToOHLCV(kline)

      if (kline.x) {
        // Kline is closed — append to historical data array
        setData((prev) => {
          // Avoid duplicates by checking the last entry's timestamp
          if (prev.length > 0 && prev[prev.length - 1].time === bar.time) {
            return [...prev.slice(0, -1), bar]
          }
          return [...prev, bar]
        })
        // Clear latestBar since it's now part of history
        setLatestBar(null)
      } else {
        // Kline is still open — update latestBar only
        setLatestBar(bar)
      }
    }

    ws.onerror = () => {
      // onerror is always followed by onclose; cleanup happens there
    }

    ws.onclose = () => {
      if (!isMountedRef.current) return
      setIsConnected(false)

      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current)
        retriesRef.current += 1
        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) connect()
        }, delay)
      }
    }
  }, [symbol, timeframe])

  useEffect(() => {
    if (typeof window === 'undefined') return

    isMountedRef.current = true

    // Reset state when symbol/timeframe changes
    setData([])
    setLatestBar(null)
    setIsConnected(false)
    retriesRef.current = 0

    connect()

    return () => {
      isMountedRef.current = false

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (wsRef.current) {
        // Remove event listeners to prevent reconnect logic from firing after unmount
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return { data, latestBar, isConnected }
}
