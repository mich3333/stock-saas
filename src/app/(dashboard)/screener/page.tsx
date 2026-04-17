'use client'

import { Suspense, useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  X,
  RefreshCw,
  Zap,
  Database,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatLargeNumber, formatPercent } from '@/lib/utils'
import {
  useScreener,
  PRESET_LABELS,
  MARKET_CAP_TIER_OPTIONS,
  DEFAULT_FILTERS,
  type SortKey,
  type PresetScreen,
  type ScreenerStock,
} from '@/hooks/useScreener'

// ── Sector colour mapping ────────────────────────────────────────────────────
const SECTOR_COLORS: Record<string, { bg: string; text: string }> = {
  Technology:  { bg: 'color-mix(in srgb, var(--accent) 16%, transparent)', text: 'var(--accent)' },
  Healthcare:  { bg: 'color-mix(in srgb, var(--green) 14%, transparent)', text: 'var(--green)' },
  Finance:     { bg: 'color-mix(in srgb, var(--green) 12%, transparent)', text: 'var(--green)' },
  Consumer:    { bg: 'rgba(245, 158, 11, 0.14)', text: '#d97706' },
  Energy:      { bg: 'rgba(249, 115, 22, 0.14)', text: '#ea580c' },
  Other:       { bg: 'var(--panel-muted)', text: 'var(--text-secondary)' },
}

function getSectorStyle(sector: string) {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other
}

// ── Market-cap tier badge ────────────────────────────────────────────────────
function marketCapTierLabel(cap: number): { label: string; color: string } {
  if (cap >= 200e9)  return { label: 'Mega',  color: '#9c27b0' }
  if (cap >= 10e9)   return { label: 'Large', color: 'var(--accent)' }
  if (cap >= 2e9)    return { label: 'Mid',   color: 'var(--green)' }
  if (cap >= 300e6)  return { label: 'Small', color: '#f4a825' }
  return               { label: 'Micro', color: 'var(--red)' }
}

// ── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ChevronDown size={10} style={{ color: 'var(--border-strong)' }} />
  return sortDir === 'asc'
    ? <ChevronUp  size={10} style={{ color: 'var(--accent)' }} />
    : <ChevronDown size={10} style={{ color: 'var(--accent)' }} />
}

// ── Preset button ────────────────────────────────────────────────────────────
const PRESET_KEYS: PresetScreen[] = ['none', 'top_gainers', 'top_losers', 'high_volume', 'large_cap', 'value']
const PRESET_ICONS: Record<PresetScreen, React.ReactNode> = {
  none:        <Database size={11} />,
  top_gainers: <TrendingUp size={11} />,
  top_losers:  <TrendingDown size={11} />,
  high_volume: <Zap size={11} />,
  large_cap:   <span style={{ fontSize: 10, fontWeight: 700 }}>M</span>,
  value:       <span style={{ fontSize: 10, fontWeight: 700 }}>V</span>,
}

// ── Table columns ────────────────────────────────────────────────────────────
const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'symbol',    label: 'Symbol' },
  { key: 'company',   label: 'Company' },
  { key: 'price',     label: 'Price',    align: 'right' },
  { key: 'changePct', label: 'Chg %',    align: 'right' },
  { key: 'volume',    label: 'Volume',   align: 'right' },
  { key: 'marketCap', label: 'Mkt Cap',  align: 'right' },
  { key: 'pe',        label: 'P/E',      align: 'right' },
  { key: 'eps',       label: 'EPS',      align: 'right' },
  { key: 'sector',    label: 'Sector' },
]

// ── Stock row ────────────────────────────────────────────────────────────────
function StockRow({ stock, isLast, onClick }: { stock: ScreenerStock; isLast: boolean; onClick: () => void }) {
  const sectorStyle = getSectorStyle(stock.sector)
  const capTier = marketCapTierLabel(stock.marketCap)

  return (
    <tr
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td className="px-4 py-2.5 font-bold" style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>
        {stock.symbol}
      </td>
      <td className="px-4 py-2.5" style={{ color: 'var(--foreground)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {stock.company}
      </td>
      <td className="px-4 py-2.5 tabular-nums font-medium text-right" style={{ color: 'var(--foreground)' }}>
        {formatCurrency(stock.price)}
      </td>
      <td className="px-4 py-2.5 tabular-nums font-medium text-right">
        <span className="inline-flex items-center gap-1 justify-end" style={{ color: stock.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {formatPercent(stock.changePct)}
        </span>
      </td>
      <td className="px-4 py-2.5 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
        {formatLargeNumber(stock.volume)}
      </td>
      <td className="px-4 py-2.5 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5 justify-end">
          {formatLargeNumber(stock.marketCap)}
          <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: capTier.color + '22', color: capTier.color }}>
            {capTier.label}
          </span>
        </span>
      </td>
      <td className="px-4 py-2.5 tabular-nums text-right" style={{ color: 'var(--text-secondary)' }}>
        {stock.pe !== null ? stock.pe.toFixed(1) : '—'}
      </td>
      <td className="px-4 py-2.5 tabular-nums text-right" style={{ color: stock.eps !== null && stock.eps >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {stock.eps !== null ? (stock.eps >= 0 ? '+' : '') + stock.eps.toFixed(2) : '—'}
      </td>
      <td className="px-4 py-2.5">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: sectorStyle.bg, color: sectorStyle.text }}
        >
          {stock.sector}
        </span>
      </td>
    </tr>
  )
}

// ── Main screener ────────────────────────────────────────────────────────────
function ScreenerContent() {
  const router = useRouter()
  const {
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
  } = useScreener()

  const [showFilters, setShowFilters] = useState(true)

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--background)' }}>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Stock Screener</h1>
          <div className="flex items-center gap-3 mt-0.5">
            {cachedAt && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Updated {new Date(cachedAt).toLocaleTimeString()}
              </p>
            )}
            {dataSource === 'live' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'color-mix(in srgb, var(--green) 14%, transparent)', color: 'var(--green)' }}>
                Live
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search symbol or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-sm rounded"
            style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', width: 220 }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{filtered.length} results</span>
          <button
            onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: showFilters ? 'var(--accent)' : 'var(--panel-muted)', color: showFilters ? '#fff' : 'var(--foreground)' }}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#fff', color: 'var(--accent)' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {(activeFilterCount > 0 || searchQuery) && (
            <button onClick={resetFilters} className="flex items-center gap-1 px-2 py-1.5 rounded text-xs" style={{ color: 'var(--text-secondary)' }}>
              <X size={11} /> Reset
            </button>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'var(--panel-muted)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Preset screens ── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: 'var(--text-secondary)' }}>Screens:</span>
        {PRESET_KEYS.map(preset => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: activePreset === preset ? 'var(--accent)' : 'var(--panel-strong)',
              color: activePreset === preset ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activePreset === preset ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {PRESET_ICONS[preset]}
            {PRESET_LABELS[preset]}
          </button>
        ))}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3" style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}>
          <FilterSelect
            label="Sector"
            value={filters.sector}
            onChange={v => setFilters(f => ({ ...f, sector: v }))}
          >
            <option value="all">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>

          <FilterSelect
            label="Market Cap"
            value={filters.marketCapTier}
            onChange={v => setFilters(f => ({ ...f, marketCapTier: v as typeof f.marketCapTier }))}
          >
            {MARKET_CAP_TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FilterSelect>

          <FilterSelect
            label="Performance"
            value={filters.changeDir}
            onChange={v => setFilters(f => ({ ...f, changeDir: v as typeof f.changeDir }))}
          >
            <option value="all">All</option>
            <option value="positive">Gainers only</option>
            <option value="negative">Losers only</option>
          </FilterSelect>

          <FilterInput label="Min Chg %" placeholder="-5" value={filters.minChangePct}
            onChange={v => setFilters(f => ({ ...f, minChangePct: v }))} />
          <FilterInput label="Max Chg %" placeholder="5" value={filters.maxChangePct}
            onChange={v => setFilters(f => ({ ...f, maxChangePct: v }))} />
          <FilterInput label="Min Price ($)" placeholder="10" value={filters.minPrice}
            onChange={v => setFilters(f => ({ ...f, minPrice: v }))} />
          <FilterInput label="Max Price ($)" placeholder="500" value={filters.maxPrice}
            onChange={v => setFilters(f => ({ ...f, maxPrice: v }))} />
          <FilterInput label="Min Mkt Cap (B)" placeholder="10" value={filters.minMarketCap}
            onChange={v => setFilters(f => ({ ...f, minMarketCap: v }))} />
          <FilterInput label="Max P/E" placeholder="50" value={filters.maxPe}
            onChange={v => setFilters(f => ({ ...f, maxPe: v }))} />
          <FilterInput label="Min Vol (M)" placeholder="5" value={filters.minVolume}
            onChange={v => setFilters(f => ({ ...f, minVolume: v }))} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-2" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw size={18} className="animate-spin" />
          Loading live market data...
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
          <button onClick={fetchData} className="px-4 py-2 rounded text-xs font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-4 py-2.5 font-medium cursor-pointer select-none ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      style={{ color: sortKey === col.key ? 'var(--foreground)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                    >
                      <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((stock, i) => (
                  <StockRow
                    key={`${stock.symbol}-${stock.sector}`}
                    stock={stock}
                    isLast={i === filtered.length - 1}
                    onClick={() => router.push(`/dashboard?symbol=${stock.symbol}`)}
                  />
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                      <SlidersHorizontal size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No stocks match your filters</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Try adjusting your criteria or clearing all filters</p>
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-lg text-xs font-medium"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table footer ── */}
          {filtered.length > 0 && (
            <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Showing {filtered.length} stock{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Click any row to open chart
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small filter input helper ────────────────────────────────────────────────
function FilterInput({ label, placeholder, value, onChange }: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs rounded"
        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
      />
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs rounded"
        style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
      >
        {children}
      </select>
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
