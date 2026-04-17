'use client'

import { Suspense, useState } from 'react'
import {
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
  type SortKey,
  type PresetScreen,
  type ScreenerStock,
} from '@/hooks/useScreener'

// ── TradingView color constants ─────────────────────────────────────────────
const TV = {
  bg:          '#131722',
  panel:       '#1e222d',
  border:      '#2a2e39',
  rowAlt:      '#161a25',
  rowHover:    '#2a2e39',
  textPrimary: '#d1d4dc',
  textMuted:   '#787b86',
  green:       '#26a69a',
  red:         '#ef5350',
  accent:      '#2962ff',
} as const

// ── Sort icon (▲▼) ──────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <span style={{ color: TV.border, fontSize: 9, marginLeft: 2 }}>▲▼</span>
  return (
    <span style={{ color: TV.textPrimary, fontSize: 9, marginLeft: 2 }}>
      {sortDir === 'asc' ? '▲' : '▼'}
    </span>
  )
}

// ── Preset buttons ──────────────────────────────────────────────────────────
const PRESET_KEYS: PresetScreen[] = ['none', 'top_gainers', 'top_losers', 'high_volume', 'large_cap', 'value']
const PRESET_ICONS: Record<PresetScreen, React.ReactNode> = {
  none:        <Database size={11} />,
  top_gainers: <TrendingUp size={11} />,
  top_losers:  <TrendingDown size={11} />,
  high_volume: <Zap size={11} />,
  large_cap:   <span style={{ fontSize: 10, fontWeight: 700 }}>M</span>,
  value:       <span style={{ fontSize: 10, fontWeight: 700 }}>V</span>,
}

// ── Table columns ───────────────────────────────────────────────────────────
const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'symbol',    label: 'SYMBOL' },
  { key: 'price',     label: 'PRICE',      align: 'right' },
  { key: 'changePct', label: 'CHANGE %',   align: 'right' },
  { key: 'volume',    label: 'VOLUME',     align: 'right' },
  { key: 'marketCap', label: 'MARKET CAP', align: 'right' },
  { key: 'pe',        label: 'P/E',        align: 'right' },
  { key: 'eps',       label: 'EPS',        align: 'right' },
  { key: 'sector',    label: 'SECTOR' },
]

// ── Stock row ───────────────────────────────────────────────────────────────
function StockRow({ stock, index, onClick }: { stock: ScreenerStock; index: number; onClick: () => void }) {
  const bgColor = index % 2 === 0 ? TV.bg : TV.rowAlt

  return (
    <tr
      style={{
        background: bgColor,
        borderBottom: `1px solid ${TV.border}`,
        cursor: 'pointer',
        height: 40,
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.background = TV.rowHover)}
      onMouseLeave={e => (e.currentTarget.style.background = bgColor)}
    >
      {/* Symbol + Company in one cell */}
      <td style={{ padding: '4px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
        <div className="tv-screener-symbol" style={{ fontWeight: 700, fontSize: 13, color: TV.textPrimary, lineHeight: 1.2 }}>
          {stock.symbol}
        </div>
        <div className="tv-screener-company" style={{ fontSize: 11, color: TV.textMuted, lineHeight: 1.2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stock.company}
        </div>
      </td>

      {/* Price */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontWeight: 500, fontSize: 13, color: TV.textPrimary, fontFamily: 'monospace', verticalAlign: 'middle' }}>
        {formatCurrency(stock.price)}
      </td>

      {/* Change % */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontWeight: 500, fontSize: 12, verticalAlign: 'middle' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          background: stock.changePct >= 0 ? `${TV.green}1A` : `${TV.red}1A`,
          color: stock.changePct >= 0 ? TV.green : TV.red,
        }}>
          {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {formatPercent(stock.changePct)}
        </span>
      </td>

      {/* Volume */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontSize: 12, color: TV.textMuted, fontFamily: 'monospace', verticalAlign: 'middle' }}>
        {formatLargeNumber(stock.volume)}
      </td>

      {/* Market Cap */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontSize: 12, color: TV.textMuted, fontFamily: 'monospace', verticalAlign: 'middle' }}>
        {formatLargeNumber(stock.marketCap)}
      </td>

      {/* P/E */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontSize: 12, color: TV.textMuted, fontFamily: 'monospace', verticalAlign: 'middle' }}>
        {stock.pe !== null ? stock.pe.toFixed(1) : '\u2014'}
      </td>

      {/* EPS */}
      <td className="tv-num" style={{ padding: '4px 16px', textAlign: 'right', fontSize: 12, fontFamily: 'monospace', verticalAlign: 'middle', color: stock.eps !== null && stock.eps >= 0 ? TV.green : TV.red }}>
        {stock.eps !== null ? (stock.eps >= 0 ? '+' : '') + stock.eps.toFixed(2) : '\u2014'}
      </td>

      {/* Sector */}
      <td style={{ padding: '4px 16px', fontSize: 12, color: TV.textMuted, verticalAlign: 'middle' }}>
        {stock.sector}
      </td>
    </tr>
  )
}

// ── Main screener ───────────────────────────────────────────────────────────
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
    <div style={{
      background: TV.bg,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '100vh',
    }}>
      {/* ── Header bar ── */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `1px solid ${TV.border}`,
        background: TV.panel,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: TV.textPrimary, margin: 0 }}>Screener</h1>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
              background: TV.accent,
              color: '#fff',
            }}>
              {filtered.length}
            </span>
            {dataSource === 'live' && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: `${TV.green}22`, color: TV.green }}>
                Live
              </span>
            )}
            {cachedAt && (
              <span style={{ fontSize: 10, color: TV.textMuted }}>
                Updated {new Date(cachedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 4,
                background: TV.bg,
                border: `1px solid ${TV.border}`,
                color: TV.textPrimary,
                outline: 'none',
                width: 200,
              }}
            />
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                border: `1px solid ${TV.border}`,
                background: showFilters ? TV.accent : TV.bg,
                color: showFilters ? '#fff' : TV.textMuted,
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={12} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  marginLeft: 2,
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  background: '#fff',
                  color: TV.accent,
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            {(activeFilterCount > 0 || searchQuery) && (
              <button
                onClick={resetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  color: TV.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={11} /> Reset
              </button>
            )}
            <button
              onClick={fetchData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                background: TV.bg,
                border: `1px solid ${TV.border}`,
                color: TV.textMuted,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Preset screens ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: TV.textMuted, marginRight: 4 }}>Screens:</span>
          {PRESET_KEYS.map(preset => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                background: activePreset === preset ? TV.accent : TV.bg,
                color: activePreset === preset ? '#fff' : TV.textMuted,
                border: `1px solid ${activePreset === preset ? TV.accent : TV.border}`,
                cursor: 'pointer',
              }}
            >
              {PRESET_ICONS[preset]}
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div style={{
          padding: '12px 20px',
          background: TV.panel,
          borderBottom: `1px solid ${TV.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
          flexShrink: 0,
        }}>
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
            <option value="positive">Gainers</option>
            <option value="negative">Losers</option>
          </FilterSelect>

          <FilterInput label="Min Chg %" placeholder="-5" value={filters.minChangePct}
            onChange={v => setFilters(f => ({ ...f, minChangePct: v }))} />
          <FilterInput label="Max Chg %" placeholder="5" value={filters.maxChangePct}
            onChange={v => setFilters(f => ({ ...f, maxChangePct: v }))} />
          <FilterInput label="Min Price" placeholder="10" value={filters.minPrice}
            onChange={v => setFilters(f => ({ ...f, minPrice: v }))} />
          <FilterInput label="Max Price" placeholder="500" value={filters.maxPrice}
            onChange={v => setFilters(f => ({ ...f, maxPrice: v }))} />
          <FilterInput label="Min Cap (B)" placeholder="10" value={filters.minMarketCap}
            onChange={v => setFilters(f => ({ ...f, minMarketCap: v }))} />
          <FilterInput label="Max P/E" placeholder="50" value={filters.maxPe}
            onChange={v => setFilters(f => ({ ...f, maxPe: v }))} />
          <FilterInput label="Min Vol (M)" placeholder="5" value={filters.minVolume}
            onChange={v => setFilters(f => ({ ...f, minVolume: v }))} />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 8, color: TV.textMuted }}>
          <RefreshCw size={18} className="animate-spin" />
          Loading live market data...
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
          <p style={{ fontSize: 13, color: TV.red }}>{error}</p>
          <button
            onClick={fetchData}
            style={{ padding: '8px 16px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: TV.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table className="tv-screener-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: TV.panel, position: 'sticky', top: 0, zIndex: 1 }}>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={sortKey === col.key ? 'sorted' : undefined}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '10px 16px',
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      userSelect: 'none',
                      textAlign: col.align === 'right' ? 'right' : 'left',
                      color: sortKey === col.key ? TV.textPrimary : TV.textMuted,
                      whiteSpace: 'nowrap',
                      borderBottom: `1px solid ${TV.border}`,
                      background: TV.panel,
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      flexDirection: col.align === 'right' ? 'row-reverse' : 'row',
                    }}>
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
                  index={i}
                  onClick={() => router.push(`/dashboard?symbol=${stock.symbol}`)}
                />
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ padding: '64px 16px', textAlign: 'center' }}>
                    <SlidersHorizontal size={36} style={{ margin: '0 auto 12px', opacity: 0.2, color: TV.textMuted, display: 'block' }} />
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: TV.textPrimary }}>No stocks match your filters</p>
                    <p style={{ fontSize: 11, marginBottom: 16, color: TV.textMuted }}>Try adjusting your criteria or clearing all filters</p>
                    <button
                      onClick={resetFilters}
                      style={{ padding: '8px 16px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: TV.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Table footer ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${TV.border}`,
          background: TV.panel,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: TV.textMuted }}>
            Showing {filtered.length} stock{filtered.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 11, color: TV.textMuted }}>
            Click any row to open chart
          </span>
        </div>
      )}
    </div>
  )
}

// ── Small filter input helper ───────────────────────────────────────────────
function FilterInput({ label, placeholder, value, onChange }: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', color: TV.textMuted }}>{label}</label>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '5px 8px',
          fontSize: 12,
          borderRadius: 4,
          background: TV.bg,
          border: `1px solid ${TV.border}`,
          color: TV.textPrimary,
          outline: 'none',
        }}
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
      <label style={{ display: 'block', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', color: TV.textMuted }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '5px 8px',
          fontSize: 12,
          borderRadius: 4,
          background: TV.bg,
          border: `1px solid ${TV.border}`,
          color: TV.textPrimary,
          outline: 'none',
        }}
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
