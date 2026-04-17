'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface WatchItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume?: number
  sparkline?: number[]
  stale?: boolean
  lastUpdated?: number
}

const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY']
const STORAGE_KEY = 'stockflow:watchlist'
const REFRESH_INTERVAL = 30_000

function loadFromStorage(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function saveToStorage(symbols: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols))
  } catch {
    // ignore
  }
}

async function fetchQuote(symbol: string): Promise<WatchItem | null> {
  try {
    const res = await fetch(`/api/stocks/${symbol}?history=true&period=1mo`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const q = data.quote ?? data
    // Build sparkline from last 15 closing prices of history
    let sparkline: number[] | undefined
    if (Array.isArray(data.history) && data.history.length > 0) {
      sparkline = (data.history as { close: number }[])
        .slice(-15)
        .map((d) => d.close)
    }
    return {
      symbol,
      name: q.shortName ?? symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
      sparkline,
      lastUpdated: Date.now(),
    }
  } catch {
    return null
  }
}

export interface UseWatchlistResult {
  items: WatchItem[]
  loading: boolean
  refreshing: boolean
  flashMap: Record<string, 'up' | 'down' | null>
  addSymbol: (symbol: string) => Promise<{ success: boolean; error?: string }>
  removeSymbol: (symbol: string) => void
  reorder: (startIndex: number, endIndex: number) => void
  refresh: () => Promise<void>
}

export function useWatchlist(): UseWatchlistResult {
  const [symbols, setSymbols] = useState<string[]>(() => loadFromStorage() ?? DEFAULT_SYMBOLS)
  const [items, setItems] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({})
  const prevPrices = useRef<Record<string, number>>({})
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Persist symbol order to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(symbols)
  }, [symbols])

  // Flash helper
  const triggerFlash = useCallback((symbol: string, direction: 'up' | 'down') => {
    if (!isMounted.current) return
    setFlashMap((f) => ({ ...f, [symbol]: direction }))
    setTimeout(() => {
      if (isMounted.current) setFlashMap((f) => ({ ...f, [symbol]: null }))
    }, 700)
  }, [])

  // Merge fetched results into items, triggering flashes
  const mergeResults = useCallback(
    (fetched: (WatchItem | null)[], syms: string[]) => {
      setItems((prev) => {
        const prevMap = Object.fromEntries(prev.map((i) => [i.symbol, i]))
        return syms.map((sym, idx) => {
          const result = fetched[idx]
          if (!result) {
            return prevMap[sym]
              ? { ...prevMap[sym], stale: true }
              : { symbol: sym, name: sym, price: 0, change: 0, changePct: 0, stale: true }
          }
          const oldPrice = prevPrices.current[sym]
          if (oldPrice !== undefined && result.price !== oldPrice) {
            triggerFlash(sym, result.price > oldPrice ? 'up' : 'down')
          }
          prevPrices.current[sym] = result.price
          return { ...result, stale: false }
        })
      })
    },
    [triggerFlash]
  )

  // Initial load - fetch all symbols in parallel
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const results = await Promise.all(symbols.map(fetchQuote))
      if (!cancelled && isMounted.current) {
        // Initialize prevPrices
        results.forEach((r) => {
          if (r) prevPrices.current[r.symbol] = r.price
        })
        mergeResults(results, symbols)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh every 30 seconds (only price, no sparkline to save bandwidth)
  useEffect(() => {
    if (loading) return
    const poll = async () => {
      if (!isMounted.current) return
      const currentSymbols = symbols
      const results = await Promise.all(
        currentSymbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/stocks/${sym}?history=true`, { cache: 'no-store' })
            if (!res.ok) return null
            const data = await res.json()
            const q = data.quote ?? data
            return {
              symbol: sym,
              name: q.shortName ?? sym,
              price: q.regularMarketPrice ?? 0,
              change: q.regularMarketChange ?? 0,
              changePct: q.regularMarketChangePercent ?? 0,
              volume: q.regularMarketVolume ?? 0,
              lastUpdated: Date.now(),
            } as WatchItem
          } catch {
            return null
          }
        })
      )
      if (!isMounted.current) return
      // Merge keeping existing sparklines
      setItems((prev) => {
        const prevMap = Object.fromEntries(prev.map((i) => [i.symbol, i]))
        return currentSymbols.map((sym, idx) => {
          const result = results[idx]
          if (!result) {
            return prevMap[sym]
              ? { ...prevMap[sym], stale: true }
              : { symbol: sym, name: sym, price: 0, change: 0, changePct: 0, stale: true }
          }
          const oldPrice = prevPrices.current[sym]
          if (oldPrice !== undefined && result.price !== oldPrice) {
            triggerFlash(sym, result.price > oldPrice ? 'up' : 'down')
          }
          prevPrices.current[sym] = result.price
          // Preserve sparkline from previous data
          return { ...result, sparkline: prevMap[sym]?.sparkline, stale: false }
        })
      })
    }

    const id = setInterval(poll, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [loading, symbols, triggerFlash])

  const refresh = useCallback(async () => {
    if (!isMounted.current) return
    setRefreshing(true)
    const currentSymbols = symbols
    const results = await Promise.all(currentSymbols.map(fetchQuote))
    if (isMounted.current) {
      results.forEach((r) => {
        if (r) prevPrices.current[r.symbol] = r.price
      })
      mergeResults(results, currentSymbols)
      setRefreshing(false)
    }
  }, [symbols, mergeResults])

  const addSymbol = useCallback(
    async (rawSymbol: string): Promise<{ success: boolean; error?: string }> => {
      const sym = rawSymbol.trim().toUpperCase()
      if (!sym) return { success: false, error: 'Symbol cannot be empty' }
      if (symbols.includes(sym)) return { success: false, error: `${sym} is already in your watchlist` }

      // Fetch to validate
      const item = await fetchQuote(sym)
      if (!isMounted.current) return { success: false, error: 'Unmounted' }

      const newItem: WatchItem = item ?? {
        symbol: sym,
        name: sym,
        price: 0,
        change: 0,
        changePct: 0,
        stale: !item,
      }

      prevPrices.current[sym] = newItem.price
      setSymbols((prev) => {
        const next = [...prev, sym]
        saveToStorage(next)
        return next
      })
      setItems((prev) => [...prev, newItem])
      return { success: true }
    },
    [symbols]
  )

  const removeSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const next = prev.filter((s) => s !== symbol)
      saveToStorage(next)
      return next
    })
    setItems((prev) => prev.filter((i) => i.symbol !== symbol))
    delete prevPrices.current[symbol]
  }, [])

  const reorder = useCallback((startIndex: number, endIndex: number) => {
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(startIndex, 1)
      next.splice(endIndex, 0, moved)
      return next
    })
    setSymbols((prev) => {
      const next = [...prev]
      const [moved] = next.splice(startIndex, 1)
      next.splice(endIndex, 0, moved)
      saveToStorage(next)
      return next
    })
  }, [])

  return { items, loading, refreshing, flashMap, addSymbol, removeSymbol, reorder, refresh }
}
