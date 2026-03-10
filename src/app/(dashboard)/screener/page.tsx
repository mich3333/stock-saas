'use client'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, SlidersHorizontal, X } from 'lucide-react'
import { STOCKS_50, StockRow } from '@/lib/stockData'
import { formatCurrency, formatLargeNumber, formatPercent } from '@/lib/utils'

type SortKey = keyof StockRow
type SortDir = 'asc' | 'desc'

interface Filters {
  sector: string
  market: string
  minMarketCap: string
  maxPe: string
  minVolume: string
  changeDir: 'all' | 'positive' | 'negative'
}

const SECTORS = Array.from(new Set(STOCKS_50.map(s => s.sector))).sort()

const DEFAULT_FILTERS: Filters = {
  sector: 'all',
  market: 'all',
  minMarketCap: '',
  maxPe: '',
  minVolume: '',
  changeDir: 'all',
}

const EU_COUNTRIES = ['NL', 'DE', 'DK', 'SE', 'UK', 'CH', 'FR', 'IT', 'PT']

function ScreenerContent() {
  const searchParams = useSearchParams()
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchQuery(q)
  }, [searchParams])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    return STOCKS_50.filter(s => {
      if (searchQuery && !s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && !s.company.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filters.sector !== 'all' && s.sector !== filters.sector) return false
      if (filters.market === 'US' && s.country !== 'US') return false
      if (filters.market === 'IL' && s.country !== 'IL') return false
      if (filters.market === 'EU' && !EU_COUNTRIES.includes(s.country)) return false
      if (filters.market === 'Football' && s.sector !== 'Sports') return false
      if (filters.minMarketCap && s.marketCap < Number(filters.minMarketCap) * 1e9) return false
      if (filters.maxPe && s.pe !== null && s.pe > Number(filters.maxPe)) return false
      if (filters.minVolume && s.volume < Number(filters.minVolume) * 1e6) return false
      if (filters.changeDir === 'positive' && s.changePct <= 0) return false
      if (filters.changeDir === 'negative' && s.changePct >= 0) return false
      return true
    }).sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      const an = Number(av)
      const bn = Number(bv)
      return sortDir === 'asc' ? an - bn : bn - an
    })
  }, [filters, sortKey, sortDir, searchQuery])

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'changeDir' ? v !== 'all' && v !== '' : v !== 'all').length

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} style={{ color: '#2A2E39' }} />
    return sortDir === 'asc' ? <ChevronUp size={10} style={{ color: '#2962FF' }} /> : <ChevronDown size={10} style={{ color: '#2962FF' }} />
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'company', label: 'Company' },
    { key: 'price', label: 'Price' },
    { key: 'changePct', label: 'Change %' },
    { key: 'volume', label: 'Volume' },
    { key: 'marketCap', label: 'Mkt Cap' },
    { key: 'pe', label: 'P/E' },
    { key: 'sector', label: 'Sector' },
  ]

  return (
    <div className="p-6 min-h-full" style={{ background: '#131722' }}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: '#D1D4DC' }}>Stock Screener</h1>
        <input
          type="text"
          placeholder="Search symbol or company..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 text-sm rounded"
          style={{ background: '#1E222D', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#787B86' }}>{filtered.length} results</span>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: showFilters ? '#2962FF' : '#2A2E39',
              color: showFilters ? '#fff' : '#D1D4DC',
            }}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#fff', color: '#2962FF' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors"
              style={{ color: '#787B86' }}
            >
              <X size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          style={{ background: '#1E222D', border: '1px solid #2A2E39' }}
        >
          {/* Sector */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Sector</label>
            <select
              value={filters.sector}
              onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            >
              <option value="all">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Market */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Market</label>
            <select
              value={filters.market}
              onChange={e => setFilters(f => ({ ...f, market: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            >
              <option value="all">All Markets</option>
              <option value="US">🇺🇸 United States</option>
              <option value="IL">🇮🇱 Israel</option>
              <option value="EU">🇪🇺 Europe</option>
              <option value="Football">⚽ Football Clubs</option>
            </select>
          </div>

          {/* Min Market Cap */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Min Mkt Cap (B)</label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={filters.minMarketCap}
              onChange={e => setFilters(f => ({ ...f, minMarketCap: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            />
          </div>

          {/* Max P/E */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Max P/E</label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={filters.maxPe}
              onChange={e => setFilters(f => ({ ...f, maxPe: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            />
          </div>

          {/* Min Volume */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Min Vol (M)</label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={filters.minVolume}
              onChange={e => setFilters(f => ({ ...f, minVolume: e.target.value }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: '#787B86' }}>Performance</label>
            <select
              value={filters.changeDir}
              onChange={e => setFilters(f => ({ ...f, changeDir: e.target.value as Filters['changeDir'] }))}
              className="w-full px-2 py-1.5 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
            >
              <option value="all">All</option>
              <option value="positive">Gainers only</option>
              <option value="negative">Losers only</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: '#1E222D', border: '1px solid #2A2E39' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2E39' }}>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-left font-medium cursor-pointer select-none"
                    style={{ color: sortKey === col.key ? '#D1D4DC' : '#787B86', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock, i) => (
                <tr
                  key={stock.symbol}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #2A2E39' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#131722')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-2.5 font-bold" style={{ color: '#2962FF' }}>{stock.symbol}</td>
                  <td className="px-4 py-2.5" style={{ color: '#D1D4DC', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stock.company}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-medium" style={{ color: '#D1D4DC' }}>
                    {formatCurrency(stock.price)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-medium">
                    <span className="flex items-center gap-1" style={{ color: stock.changePct >= 0 ? '#26a69a' : '#ef5350' }}>
                      {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {formatPercent(stock.changePct)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#787B86' }}>
                    {formatLargeNumber(stock.volume)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#787B86' }}>
                    {formatLargeNumber(stock.marketCap)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums" style={{ color: '#787B86' }}>
                    {stock.pe !== null ? stock.pe.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: '#2A2E39', color: '#787B86' }}
                    >
                      {stock.sector}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs" style={{ color: '#787B86' }}>
                    No stocks match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerContent />
    </Suspense>
  )
}
