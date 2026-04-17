'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChartPoint } from '@/types'

export type Timeframe = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y'

// Maps UI timeframes to API period params
const PERIOD_MAP: Record<Timeframe, string> = {
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1Y': '1y',
  '2Y': '2y',
  '5Y': '5y',
}

interface UseChartDataResult {
  data: ChartPoint[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useChartData(symbol: string, timeframe: Timeframe): UseChartDataResult {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!symbol) return

    // Cancel in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const period = PERIOD_MAP[timeframe]
      const res = await fetch(
        `/api/stocks/${symbol}?history=true&period=${period}`,
        { signal: controller.signal }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const history: ChartPoint[] = json.history ?? []
      setData(history)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message ?? 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }, [symbol, timeframe])

  useEffect(() => {
    fetchData()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
