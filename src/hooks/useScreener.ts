'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

export interface ScreenerStock {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  volume: number
  marketCap: number
  pe: number | null
  eps: number | null
  sector: string
}

export type SortKey = keyof ScreenerStock
export type SortDir = 'asc' | 'desc'

export type MarketCapTier = 'all' | 'mega' | 'large' | 'mid' | 'small' | 'micro'

export interface ScreenerFilters {
  sector: string
  marketCapTier: MarketCapTier
  minMarketCap: string
  maxPe: string
  minVolume: string
  minPrice: string
  maxPrice: string
  minChangePct: string
  maxChangePct: string
  changeDir: 'all' | 'positive' | 'negative'
}

export type PresetScreen = 'none' | 'top_gainers' | 'top_losers' | 'high_volume' | 'large_cap' | 'value'

export const DEFAULT_FILTERS: ScreenerFilters = {
  sector: 'all',
  marketCapTier: 'all',
  minMarketCap: '',
  maxPe: '',
  minVolume: '',
  minPrice: '',
  maxPrice: '',
  minChangePct: '',
  maxChangePct: '',
  changeDir: 'all',
}

const MARKET_CAP_TIERS: Record<MarketCapTier, { min: number; max: number; label: string }> = {
  all:   { min: 0,         max: Infinity,       label: 'All' },
  mega:  { min: 200e9,     max: Infinity,       label: 'Mega Cap (>$200B)' },
  large: { min: 10e9,      max: 200e9,          label: 'Large Cap ($10B-$200B)' },
  mid:   { min: 2e9,       max: 10e9,           label: 'Mid Cap ($2B-$10B)' },
  small: { min: 300e6,     max: 2e9,            label: 'Small Cap ($300M-$2B)' },
  micro: { min: 0,         max: 300e6,          label: 'Micro Cap (<$300M)' },
}

export const MARKET_CAP_TIER_OPTIONS = Object.entries(MARKET_CAP_TIERS).map(([key, val]) => ({
  value: key as MarketCapTier,
  label: val.label,
}))

const PRESET_CONFIGS: Record<PresetScreen, Partial<ScreenerFilters> & { sortKey?: SortKey; sortDir?: SortDir }> = {
  none:        {},
  top_gainers: { changeDir: 'positive', sortKey: 'changePct', sortDir: 'desc' },
  top_losers:  { changeDir: 'negative', sortKey: 'changePct', sortDir: 'asc' },
  high_volume: { sortKey: 'volume', sortDir: 'desc' },
  large_cap:   { marketCapTier: 'mega', sortKey: 'marketCap', sortDir: 'desc' },
  value:       { maxPe: '20', changeDir: 'all', sortKey: 'pe', sortDir: 'asc' },
}

export const PRESET_LABELS: Record<PresetScreen, string> = {
  none:        'All Stocks',
  top_gainers: 'Top Gainers',
  top_losers:  'Top Losers',
  high_volume: 'High Volume',
  large_cap:   'Mega Cap',
  value:       'Value (P/E < 20)',
}

function applyFilters(stocks: ScreenerStock[], filters: ScreenerFilters, searchQuery: string): ScreenerStock[] {
  const query = searchQuery.toLowerCase()
  return stocks.filter(s => {
    if (query && !s.symbol.toLowerCase().includes(query) && !s.company.toLowerCase().includes(query)) return false
    if (filters.sector !== 'all' && s.sector !== filters.sector) return false
    if (filters.marketCapTier !== 'all') {
      const tier = MARKET_CAP_TIERS[filters.marketCapTier]
      if (s.marketCap < tier.min || s.marketCap > tier.max) return false
    }
    if (filters.minMarketCap && s.marketCap < Number(filters.minMarketCap) * 1e9) return false
    if (filters.maxPe && s.pe !== null && s.pe > Number(filters.maxPe)) return false
    if (filters.minVolume && s.volume < Number(filters.minVolume) * 1e6) return false
    if (filters.minPrice && s.price < Number(filters.minPrice)) return false
    if (filters.maxPrice && s.price > Number(filters.maxPrice)) return false
    if (filters.minChangePct && s.changePct < Number(filters.minChangePct)) return false
    if (filters.maxChangePct && s.changePct > Number(filters.maxChangePct)) return false
    if (filters.changeDir === 'positive' && s.changePct <= 0) return false
    if (filters.changeDir === 'negative' && s.changePct >= 0) return false
    return true
  })
}

function sortStocks(stocks: ScreenerStock[], key: SortKey, dir: SortDir): ScreenerStock[] {
  return [...stocks].sort((a, b) => {
    const av = a[key] ?? (dir === 'asc' ? Infinity : -Infinity)
    const bv = b[key] ?? (dir === 'asc' ? Infinity : -Infinity)
    if (typeof av === 'string' && typeof bv === 'string') {
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return dir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av)
  })
}

export function useScreener() {
  const [allStocks, setAllStocks] = useState<ScreenerStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('live')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [activePreset, setActivePreset] = useState<PresetScreen>('none')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/screener')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setAllStocks(json.stocks ?? [])
      setCachedAt(json.cachedAt ?? null)
      setDataSource(json.source ?? 'live')
    } catch {
      setError('Failed to load screener data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const applyPreset = useCallback((preset: PresetScreen) => {
    setActivePreset(preset)
    if (preset === 'none') {
      setFilters(DEFAULT_FILTERS)
      setSortKey('marketCap')
      setSortDir('desc')
      return
    }
    const config = PRESET_CONFIGS[preset]
    setFilters({ ...DEFAULT_FILTERS, ...config })
    if (config.sortKey) setSortKey(config.sortKey)
    if (config.sortDir) setSortDir(config.sortDir)
  }, [])

  const handleSort = useCallback((key: SortKey) => {
    setActivePreset('none')
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortDir('desc')
      return key
    })
  }, [])

  const sectors = useMemo(() => Array.from(new Set(allStocks.map(s => s.sector))).sort(), [allStocks])

  const filtered = useMemo(() => {
    const f = applyFilters(allStocks, filters, searchQuery)
    return sortStocks(f, sortKey, sortDir)
  }, [allStocks, filters, sortKey, sortDir, searchQuery])

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => {
      if (k === 'changeDir') return v !== 'all'
      if (k === 'marketCapTier') return v !== 'all'
      if (k === 'sector') return v !== 'all'
      return v !== ''
    }).length
  }, [filters])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setActivePreset('none')
    setSortKey('marketCap')
    setSortDir('desc')
    setSearchQuery('')
  }, [])

  return {
    allStocks,
    filtered,
    loading,
    error,
    cachedAt,
    dataSource,
    sortKey,
    sortDir,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    sectors,
    activePreset,
    applyPreset,
    handleSort,
    activeFilterCount,
    resetFilters,
    fetchData,
  }
}
