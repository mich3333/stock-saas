'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { HeatmapSector } from '@/app/api/heatmap/route'

export type Timeframe = '1D' | '1W' | '1M' | '3M'
export type GroupBy = 'sector' | 'marketcap'

export interface HeatmapState {
  sectors: HeatmapSector[]
  timeframe: Timeframe
  updatedAt: string | null
  loading: boolean
  error: string | null
}

export function useHeatmap(
  timeframe: Timeframe = '1D',
  refreshInterval = 60_000
) {
  const [state, setState] = useState<HeatmapState>({
    sectors: [],
    timeframe,
    updatedAt: null,
    loading: true,
    error: null,
  })

  const abortRef = useRef<AbortController | null>(null)

  const fetch_ = useCallback(async (tf: Timeframe) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(`/api/heatmap?timeframe=${tf}`, { signal: ctrl.signal })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`)
      }
      setState({
        sectors: json.sectors ?? [],
        timeframe: tf,
        updatedAt: json.updatedAt ?? null,
        loading: false,
        error: null,
      })
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load',
      }))
    }
  }, [])

  // Fetch on timeframe change
  useEffect(() => {
    void fetch_(timeframe)
  }, [timeframe, fetch_])

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(() => void fetch_(timeframe), refreshInterval)
    return () => clearInterval(id)
  }, [timeframe, refreshInterval, fetch_])

  const refresh = useCallback(() => void fetch_(timeframe), [timeframe, fetch_])

  return { ...state, refresh }
}
