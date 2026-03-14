'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface Stock {
  symbol: string
  name: string
  price: number
  changePercent: number
  marketCap: number
}

interface Sector {
  name: string
  stocks: Stock[]
}

interface HeatmapData {
  sectors: Sector[]
  updatedAt: string
}

function getColor(pct: number): string {
  if (pct <= -3)   return '#7f1d1d'
  if (pct <= -1)   return '#b91c1c'
  if (pct <= -0.2) return '#dc2626'
  if (pct <   0.2) return '#374151'
  if (pct <   1)   return '#166534'
  if (pct <   3)   return '#15803d'
  return '#14532d'
}

function formatPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function formatPrice(v: number) {
  return v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`
}

function formatMcap(v: number) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9)  return `${(v / 1e9).toFixed(0)}B`
  return `${(v / 1e6).toFixed(0)}M`
}

interface TileProps {
  stock: Stock
  width: number
  height: number
  onClick: () => void
}

function Tile({ stock, width, height, onClick }: TileProps) {
  const [hovered, setHovered] = useState(false)
  const bg = getColor(stock.changePercent)
  const showPrice = width > 80 && height > 55

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        height,
        background: bg,
        border: '1px solid rgba(0,0,0,0.3)',
        borderRadius: 3,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        position: 'relative',
        transition: 'filter 0.15s',
        filter: hovered ? 'brightness(1.25)' : 'brightness(1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: Math.min(14, Math.max(9, width / 5)), color: '#fff', lineHeight: 1.2 }}>
        {stock.symbol}
      </span>
      <span style={{ fontSize: Math.min(12, Math.max(8, width / 6)), color: stock.changePercent >= 0 ? '#86efac' : '#fca5a5', lineHeight: 1.2 }}>
        {formatPct(stock.changePercent)}
      </span>
      {showPrice && (
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }}>
          {formatPrice(stock.price)}
        </span>
      )}

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'fixed',
          zIndex: 9999,
          background: '#1E222D',
          border: '1px solid #2A2E39',
          borderRadius: 8,
          padding: '10px 14px',
          pointerEvents: 'none',
          minWidth: 160,
          transform: 'translate(-50%, -110%)',
          left: '50%',
          top: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 700, color: '#D1D4DC', marginBottom: 4 }}>{stock.symbol}</div>
          <div style={{ color: '#787B86', fontSize: 11, marginBottom: 6 }}>{stock.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: '#787B86', fontSize: 12 }}>Price</span>
            <span style={{ color: '#D1D4DC', fontSize: 12, fontWeight: 600 }}>{formatPrice(stock.price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: '#787B86', fontSize: 12 }}>Change</span>
            <span style={{ color: stock.changePercent >= 0 ? '#26A69A' : '#EF5350', fontSize: 12, fontWeight: 600 }}>
              {formatPct(stock.changePercent)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: '#787B86', fontSize: 12 }}>Mkt Cap</span>
            <span style={{ color: '#D1D4DC', fontSize: 12 }}>{formatMcap(stock.marketCap)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface HeatmapProps {
  sizeBy?: 'marketCap' | 'equal'
  groupBy?: 'sector' | 'all'
}

export default function Heatmap({ sizeBy = 'marketCap', groupBy = 'sector' }: HeatmapProps) {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/heatmap')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Failed to load heatmap data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#787B86' }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
      Loading market data...
    </div>
  )

  if (error || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#EF5350' }}>
      {error ?? 'No data'}
    </div>
  )

  const sectors = groupBy === 'all'
    ? [{ name: 'All Stocks', stocks: data.sectors.flatMap(s => s.stocks) }]
    : data.sectors

  const TILE_BASE = 800

  return (
    <div style={{ width: '100%' }}>
      {/* Last updated */}
      <div style={{ color: '#787B86', fontSize: 11, marginBottom: 12 }}>
        Updated: {new Date(data.updatedAt).toLocaleTimeString()}
      </div>

      {/* Sectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sectors.map((sector) => {
          const totalMcap = sector.stocks.reduce((s, st) => s + (st.marketCap || 1), 0)

          return (
            <div key={sector.name} style={{
              background: '#1E222D',
              border: '1px solid #2A2E39',
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ color: '#787B86', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {sector.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {sector.stocks
                  .slice()
                  .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
                  .map((stock) => {
                    const share = sizeBy === 'marketCap'
                      ? (stock.marketCap || 1) / totalMcap
                      : 1 / sector.stocks.length
                    const w = Math.max(50, Math.floor(share * TILE_BASE))
                    const h = Math.max(44, Math.min(90, Math.floor(w * 0.65)))
                    return (
                      <Tile
                        key={stock.symbol}
                        stock={stock}
                        width={w}
                        height={h}
                        onClick={() => router.push(`/dashboard?symbol=${stock.symbol}`)}
                      />
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, justifyContent: 'center' }}>
        <span style={{ color: '#787B86', fontSize: 11 }}>-3%</span>
        {['#7f1d1d','#b91c1c','#dc2626','#374151','#166534','#15803d','#14532d'].map((c, i) => (
          <div key={i} style={{ width: 36, height: 14, background: c, borderRadius: 2 }} />
        ))}
        <span style={{ color: '#787B86', fontSize: 11 }}>+3%</span>
      </div>
    </div>
  )
}
