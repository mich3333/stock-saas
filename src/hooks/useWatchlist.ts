'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface WatchItem {
  symbol: string       // TradingView symbol e.g. "SP:SPX"
  routeSymbol: string  // Yahoo Finance symbol for chart navigation e.g. "^GSPC"
  name: string
  price: number
  change: number
  changePct: number
  volume?: number
  sparkline?: number[]
  stale?: boolean
  lastUpdated?: number
}

export interface WatchCategory {
  label: string
  symbols: string[]
}

// TradingView symbol → Yahoo Finance symbol (for chart routing)
export const TV_TO_YF: Record<string, string> = {
  'SP:SPX':          '^GSPC',
  'PEPPERSTONE:NDQ': '^IXIC',
  'DJ:DJI':          '^DJI',
  'CBOE:VIX':        '^VIX',
  'TVC:DXY':         'DX-Y.NYB',
  'NASDAQ:AAPL':     'AAPL',
  'NASDAQ:TSLA':     'TSLA',
  'NASDAQ:NFLX':     'NFLX',
  'TVC:USOIL':       'CL=F',
  'TVC:GOLD':        'GC=F',
  'TVC:SILVER':      'SI=F',
  'FX:EURUSD':       'EURUSD=X',
  'FX:GBPUSD':       'GBPUSD=X',
  'FX_IDC:USDJPY':   'USDJPY=X',
  'BINANCE:BTCUSDT': 'BTC-USD',
  'BINANCE:ETHUSDT': 'ETH-USD',
}

export const TV_TO_APP_SYMBOL: Record<string, string> = {
  'SP:SPX': 'SPX',
  'PEPPERSTONE:NDQ': 'NDQ',
  'DJ:DJI': 'DJI',
  'CBOE:VIX': 'VIX',
  'TVC:DXY': 'DXY',
  'NASDAQ:AAPL': 'AAPL',
  'NASDAQ:TSLA': 'TSLA',
  'NASDAQ:NFLX': 'NFLX',
  'TVC:USOIL': 'CL1!',
  'TVC:GOLD': 'GOLD',
  'TVC:SILVER': 'SILVER',
  'FX:EURUSD': 'EURUSD',
  'FX:GBPUSD': 'GBPUSD',
  'FX_IDC:USDJPY': 'USDJPY',
  'BINANCE:BTCUSDT': 'BTCUSD',
  'BINANCE:ETHUSDT': 'ETHUSD',
}

// Short display names
export const SYMBOL_DISPLAY: Record<string, string> = {
  'SP:SPX':          'SPX',
  'PEPPERSTONE:NDQ': 'NDQ',
  'DJ:DJI':          'DJI',
  'CBOE:VIX':        'VIX',
  'TVC:DXY':         'DXY',
  'NASDAQ:AAPL':     'AAPL',
  'NASDAQ:TSLA':     'TSLA',
  'NASDAQ:NFLX':     'NFLX',
  'TVC:USOIL':       'USOIL',
  'TVC:GOLD':        'GOLD',
  'TVC:SILVER':      'SILVER',
  'FX:EURUSD':       'EURUSD',
  'FX:GBPUSD':       'GBPUSD',
  'FX_IDC:USDJPY':   'USDJPY',
  'BINANCE:BTCUSDT': 'BTCUSD',
  'BINANCE:ETHUSDT': 'ETHUSD',
}

export const WATCH_CATEGORIES: WatchCategory[] = [
  { label: 'INDICES', symbols: ['SP:SPX', 'PEPPERSTONE:NDQ', 'DJ:DJI', 'CBOE:VIX', 'TVC:DXY'] },
  { label: 'STOCKS',  symbols: ['NASDAQ:AAPL', 'NASDAQ:TSLA', 'NASDAQ:NFLX'] },
  { label: 'FUTURES', symbols: ['TVC:USOIL', 'TVC:GOLD', 'TVC:SILVER'] },
  { label: 'FOREX',   symbols: ['FX:EURUSD', 'FX:GBPUSD', 'FX_IDC:USDJPY'] },
  { label: 'CRYPTO',  symbols: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'] },
]

export const CATEGORY_MAP: Record<string, string> = {}
for (const cat of WATCH_CATEGORIES) {
  for (const sym of cat.symbols) {
    CATEGORY_MAP[sym] = cat.label
  }
}

const DEFAULT_SYMBOLS = WATCH_CATEGORIES.flatMap((c) => c.symbols)
const STORAGE_KEY = 'stockflow:watchlist:tv'
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

async function fetchTVPrices(symbols: string[]): Promise<Map<string, WatchItem>> {
  const result = new Map<string, WatchItem>()
  try {
    const res = await fetch('/api/tv-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
      cache: 'no-store',
    })
    if (!res.ok) return result
    const data = await res.json()
    for (const item of data) {
      result.set(item.symbol, {
        symbol: item.symbol,
        routeSymbol: TV_TO_YF[item.symbol] ?? item.symbol,
        name: item.name,
        price: item.price,
        change: item.change,
        changePct: item.changePercent,
        volume: item.volume,
        lastUpdated: Date.now(),
      })
    }
  } catch {
    // ignore
  }
  return result
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
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    saveToStorage(symbols)
  }, [symbols])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncSymbols = () => {
      const stored = loadFromStorage()
      if (!stored) return
      setSymbols((prev) => {
        if (prev.length === stored.length && prev.every((symbol, index) => symbol === stored[index])) {
          return prev
        }
        return stored
      })
    }

    window.addEventListener('storage', syncSymbols)
    window.addEventListener('stockflow:watchlist-updated', syncSymbols as EventListener)

    return () => {
      window.removeEventListener('storage', syncSymbols)
      window.removeEventListener('stockflow:watchlist-updated', syncSymbols as EventListener)
    }
  }, [])

  const triggerFlash = useCallback((symbol: string, direction: 'up' | 'down') => {
    if (!isMounted.current) return
    setFlashMap((f) => ({ ...f, [symbol]: direction }))
    setTimeout(() => {
      if (isMounted.current) setFlashMap((f) => ({ ...f, [symbol]: null }))
    }, 700)
  }, [])

  const mergeResults = useCallback(
    (fetched: Map<string, WatchItem>, syms: string[], keepSparklines = false) => {
      setItems((prev) => {
        const prevMap = Object.fromEntries(prev.map((i) => [i.symbol, i]))
        return syms.map((sym) => {
          const result = fetched.get(sym)
          if (!result) {
            return prevMap[sym]
              ? { ...prevMap[sym], stale: true }
              : { symbol: sym, routeSymbol: TV_TO_YF[sym] ?? sym, name: SYMBOL_DISPLAY[sym] ?? sym, price: 0, change: 0, changePct: 0, stale: true }
          }
          const oldPrice = prevPrices.current[sym]
          if (oldPrice !== undefined && result.price !== oldPrice) {
            triggerFlash(sym, result.price > oldPrice ? 'up' : 'down')
          }
          prevPrices.current[sym] = result.price
          return {
            ...result,
            stale: false,
            sparkline: keepSparklines ? prevMap[sym]?.sparkline : result.sparkline,
          }
        })
      })
    },
    [triggerFlash]
  )

  // Initial load
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const results = await fetchTVPrices(symbols)
      if (!cancelled && isMounted.current) {
        results.forEach((r) => { prevPrices.current[r.symbol] = r.price })
        mergeResults(results, symbols)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (loading) return
    const poll = async () => {
      if (!isMounted.current) return
      const currentSymbols = symbols
      const results = await fetchTVPrices(currentSymbols)
      if (!isMounted.current) return
      mergeResults(results, currentSymbols, true)
    }
    const id = setInterval(poll, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [loading, symbols, mergeResults])

  const refresh = useCallback(async () => {
    if (!isMounted.current) return
    setRefreshing(true)
    const currentSymbols = symbols
    const results = await fetchTVPrices(currentSymbols)
    if (isMounted.current) {
      results.forEach((r) => { prevPrices.current[r.symbol] = r.price })
      mergeResults(results, currentSymbols)
      setRefreshing(false)
    }
  }, [symbols, mergeResults])

  const addSymbol = useCallback(
    async (rawSymbol: string): Promise<{ success: boolean; error?: string }> => {
      const sym = rawSymbol.trim().toUpperCase()
      if (!sym) return { success: false, error: 'Symbol cannot be empty' }
      if (symbols.includes(sym)) return { success: false, error: `${sym} is already in your watchlist` }

      const results = await fetchTVPrices([sym])
      if (!isMounted.current) return { success: false, error: 'Unmounted' }

      const fetched = results.get(sym)
      const newItem: WatchItem = fetched ?? {
        symbol: sym,
        routeSymbol: TV_TO_YF[sym] ?? sym,
        name: SYMBOL_DISPLAY[sym] ?? sym,
        price: 0,
        change: 0,
        changePct: 0,
        stale: true,
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

  useEffect(() => {
    if (loading) return

    const currentSymbols = symbols
    void fetchTVPrices(currentSymbols).then((results) => {
      if (!isMounted.current) return
      results.forEach((r) => { prevPrices.current[r.symbol] = r.price })
      mergeResults(results, currentSymbols, true)
    })
  }, [symbols, loading, mergeResults])

  return { items, loading, refreshing, flashMap, addSymbol, removeSymbol, reorder, refresh }
}
