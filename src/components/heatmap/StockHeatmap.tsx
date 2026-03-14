'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useHeatmap, type Timeframe, type GroupBy } from '@/hooks/useHeatmap'
import type { HeatmapSector, HeatmapStock } from '@/app/api/heatmap/route'

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Map a % change value to a heatmap color.
 *  -5% → strong red (#EF5350),  0% → neutral (#2A2E39),  +5% → strong green (#26A69A)
 */
function changeToColor(pct: number): string {
  const clamped = Math.max(-5, Math.min(5, pct))

  if (clamped < 0) {
    // 0 → neutral, -5 → strong red
    const t = -clamped / 5 // 0..1
    const r = Math.round(42 + (239 - 42) * t)
    const g = Math.round(46 + (83  - 46) * t)
    const b = Math.round(57 + (80  - 57) * t)
    return `rgb(${r},${g},${b})`
  } else {
    // 0 → neutral, +5 → strong green
    const t = clamped / 5 // 0..1
    const r = Math.round(42 + (38  - 42) * t)
    const g = Math.round(46 + (166 - 46) * t)
    const b = Math.round(57 + (154 - 57) * t)
    return `rgb(${r},${g},${b})`
  }
}

function textColor(pct: number): string {
  const abs = Math.abs(pct)
  if (abs >= 2) return '#FFFFFF'
  if (abs >= 0.5) return 'var(--foreground)'
  return 'var(--text-secondary)'
}

function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(1)}T`
  if (mc >= 1e9)  return `$${(mc / 1e9).toFixed(0)}B`
  return `$${(mc / 1e6).toFixed(0)}M`
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return `${(v / 1e3).toFixed(0)}K`
}

// ---------------------------------------------------------------------------
// Squarified treemap algorithm
// ---------------------------------------------------------------------------

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface TreemapNode extends Rect {
  stock: HeatmapStock
}

function squarify(stocks: HeatmapStock[], rect: Rect): TreemapNode[] {
  if (!stocks.length) return []
  const total = stocks.reduce((s, t) => s + t.marketCap, 0)
  if (total === 0 || rect.w <= 0 || rect.h <= 0) return []

  const area = rect.w * rect.h
  const items = stocks.map((s) => ({ stock: s, area: (s.marketCap / total) * area }))

  const result: TreemapNode[] = []
  layoutRow(items, rect, result)
  return result
}

function layoutRow(
  items: { stock: HeatmapStock; area: number }[],
  rect: Rect,
  result: TreemapNode[]
) {
  if (!items.length) return
  if (items.length === 1) {
    result.push({ ...rect, stock: items[0].stock })
    return
  }

  const totalArea = items.reduce((s, i) => s + i.area, 0)

  // Try to lay out the best row/column using squarification
  const horizontal = rect.w >= rect.h

  // Find the ideal split point
  let bestWorst = Infinity
  let splitIdx = 1

  for (let k = 1; k <= items.length; k++) {
    const rowArea = items.slice(0, k).reduce((s, i) => s + i.area, 0)
    const stripe = horizontal ? rect.h : rect.w
    const stripeLen = rowArea / stripe
    let worst = 0
    for (let j = 0; j < k; j++) {
      const dim = items[j].area / stripeLen
      const ratio = Math.max(stripe / dim, dim / stripe) * Math.max(stripe / stripeLen, stripeLen / stripe)
      if (ratio > worst) worst = ratio
    }
    if (k > 1 && worst > bestWorst) break
    bestWorst = worst
    splitIdx = k
  }

  const rowItems  = items.slice(0, splitIdx)
  const restItems = items.slice(splitIdx)
  const rowArea   = rowItems.reduce((s, i) => s + i.area, 0)

  let rowRect: Rect
  let restRect: Rect

  if (horizontal) {
    const stripeW = rowArea / rect.h
    rowRect  = { x: rect.x, y: rect.y, w: stripeW, h: rect.h }
    restRect = { x: rect.x + stripeW, y: rect.y, w: rect.w - stripeW, h: rect.h }
    // lay items in rowRect vertically
    let cy = rect.y
    for (const item of rowItems) {
      const h = item.area / stripeW
      result.push({ x: rect.x, y: cy, w: stripeW, h, stock: item.stock })
      cy += h
    }
  } else {
    const stripeH = rowArea / rect.w
    rowRect  = { x: rect.x, y: rect.y, w: rect.w, h: stripeH }
    restRect = { x: rect.x, y: rect.y + stripeH, w: rect.w, h: rect.h - stripeH }
    // lay items in rowRect horizontally
    let cx = rect.x
    for (const item of rowItems) {
      const w = item.area / stripeH
      result.push({ x: cx, y: rect.y, w, h: stripeH, stock: item.stock })
      cx += w
    }
  }

  void rowRect // used implicitly via items placement above

  if (restItems.length && restRect.w > 0 && restRect.h > 0) {
    const restTotal = restItems.reduce((s, i) => s + i.area, 0)
    const restArea  = restRect.w * restRect.h
    const scaled    = restItems.map((i) => ({ ...i, area: (i.area / restTotal) * restArea }))
    layoutRow(scaled, restRect, result)
  }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipProps {
  stock: HeatmapStock
  x: number
  y: number
  containerW: number
  containerH: number
}

function Tooltip({ stock, x, y, containerW, containerH }: TooltipProps) {
  const W = 200
  const H = 140
  const left = x + W + 12 > containerW ? x - W - 8 : x + 12
  const top  = y + H + 12 > containerH ? y - H - 8 : y + 12

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: W,
        background: 'var(--panel-strong)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 12px',
        pointerEvents: 'none',
        zIndex: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', marginBottom: 2 }}>{stock.symbol}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{stock.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Price</span>
        <span style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 600 }}>${stock.price.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Change</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: stock.changePercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Market Cap</span>
        <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{formatMarketCap(stock.marketCap)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Volume</span>
        <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{formatVolume(stock.volume)}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single stock tile
// ---------------------------------------------------------------------------

interface TileProps {
  node: TreemapNode
  gap: number
  onHover: (stock: HeatmapStock | null, x: number, y: number) => void
}

function StockTile({ node, gap, onHover }: TileProps) {
  const { x, y, w, h, stock } = node
  const bg = changeToColor(stock.changePercent)
  const tc = textColor(stock.changePercent)
  const px = x + gap / 2
  const py = y + gap / 2
  const pw = w - gap
  const ph = h - gap

  if (pw < 4 || ph < 4) return null

  const showSymbol = pw > 30 && ph > 18
  const showPct    = pw > 30 && ph > 32
  const showName   = pw > 60 && ph > 52

  return (
    <g
      onMouseMove={(e) => {
        const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
        onHover(stock, e.clientX - rect.left, e.clientY - rect.top)
      }}
      onMouseLeave={() => onHover(null, 0, 0)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={px}
        y={py}
        width={pw}
        height={ph}
        rx={3}
        fill={bg}
        stroke="var(--background)"
        strokeWidth={0.5}
      />
      {showSymbol && (
        <text
          x={px + pw / 2}
          y={py + ph / 2 + (showName ? -10 : showPct ? -6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={tc}
          fontSize={Math.min(Math.max(pw / 5, 8), 16)}
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ userSelect: 'none' }}
        >
          {stock.symbol}
        </text>
      )}
      {showPct && (
        <text
          x={px + pw / 2}
          y={py + ph / 2 + (showSymbol ? 10 : 0) + (showName ? 0 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={tc}
          fontSize={Math.min(Math.max(pw / 7, 7), 12)}
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ userSelect: 'none', opacity: 0.9 }}
        >
          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </text>
      )}
      {showName && ph > 70 && (
        <text
          x={px + pw / 2}
          y={py + ph / 2 + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={tc}
          fontSize={Math.min(Math.max(pw / 9, 6), 10)}
          fontFamily="system-ui, -apple-system, sans-serif"
          style={{ userSelect: 'none', opacity: 0.7 }}
        >
          {stock.name.length > Math.floor(pw / 6) ? stock.name.slice(0, Math.floor(pw / 6)) + '…' : stock.name}
        </text>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Sector block
// ---------------------------------------------------------------------------

interface SectorBlockProps {
  sector: HeatmapSector
  rect: Rect
  gap: number
  onHover: (stock: HeatmapStock | null, x: number, y: number) => void
}

const SECTOR_HEADER = 22

function SectorBlock({ sector, rect, gap, onHover }: SectorBlockProps) {
  const innerRect: Rect = {
    x: rect.x,
    y: rect.y + SECTOR_HEADER,
    w: rect.w,
    h: rect.h - SECTOR_HEADER,
  }
  if (innerRect.w <= 0 || innerRect.h <= 0) return null

  const sorted = [...sector.stocks].sort((a, b) => b.marketCap - a.marketCap)
  const nodes = squarify(sorted, innerRect)
  const labelColor = sector.avgChangePercent >= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <g>
      {/* Sector label background */}
      <rect
        x={rect.x + gap / 2}
        y={rect.y + gap / 2}
        width={rect.w - gap}
        height={SECTOR_HEADER - gap / 2}
        rx={3}
        fill="var(--panel-strong)"
        stroke="var(--border)"
        strokeWidth={0.5}
      />
      <text
        x={rect.x + gap + 8}
        y={rect.y + SECTOR_HEADER / 2 + gap / 2 + 1}
        fill="var(--foreground)"
        fontSize={11}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        dominantBaseline="middle"
      >
        {sector.name}
      </text>
      <text
        x={rect.x + rect.w - gap - 6}
        y={rect.y + SECTOR_HEADER / 2 + gap / 2 + 1}
        fill={labelColor}
        fontSize={10}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        dominantBaseline="middle"
        textAnchor="end"
      >
        {sector.avgChangePercent >= 0 ? '+' : ''}{sector.avgChangePercent.toFixed(2)}%
      </text>

      {nodes.map((node) => (
        <StockTile
          key={node.stock.symbol}
          node={node}
          gap={gap}
          onHover={onHover}
        />
      ))}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Color legend
// ---------------------------------------------------------------------------

function ColorLegend() {
  const steps = [-5, -3, -1, 0, 1, 3, 5]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>-5%</span>
      <div style={{ display: 'flex', height: 12, width: 120, borderRadius: 3, overflow: 'hidden' }}>
        {steps.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: changeToColor(v),
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>+5%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M']
const SECTORS_LIST = ['All', 'Technology', 'Healthcare', 'Finance', 'Consumer', 'Energy', 'Communication', 'Industrials', 'Materials', 'Utilities', 'Real Estate']

export interface StockHeatmapProps {
  initialTimeframe?: Timeframe
}

export default function StockHeatmap({ initialTimeframe = '1D' }: StockHeatmapProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe)
  const [groupBy, setGroupBy] = useState<GroupBy>('sector')
  const [activeSector, setActiveSector] = useState<string>('All')

  const { sectors, loading, error, updatedAt, refresh } = useHeatmap(timeframe)

  const [tooltip, setTooltip] = useState<{ stock: HeatmapStock; x: number; y: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 900, h: 580 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setDims({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleHover = useCallback((stock: HeatmapStock | null, x: number, y: number) => {
    setTooltip(stock ? { stock, x, y } : null)
  }, [])

  // Filter + layout sectors
  const visibleSectors = useMemo(() => {
    const filtered = activeSector === 'All' ? sectors : sectors.filter((s) => s.name === activeSector)

    if (groupBy === 'marketcap') {
      // Flatten into one pseudo-sector ordered by market cap
      const allStocks = filtered.flatMap((s) => s.stocks).sort((a, b) => b.marketCap - a.marketCap)
      const totalMC = allStocks.reduce((acc, s) => acc + s.marketCap, 0)
      const avgChg = allStocks.length ? allStocks.reduce((acc, s) => acc + s.changePercent, 0) / allStocks.length : 0
      return [{ name: 'All', stocks: allStocks, totalMarketCap: totalMC, avgChangePercent: +avgChg.toFixed(2) }]
    }

    return filtered
  }, [sectors, activeSector, groupBy])

  // Lay out sector rects using the same treemap on the whole canvas
  const sectorRects = useMemo<{ sector: HeatmapSector; rect: Rect }[]>(() => {
    if (!visibleSectors.length) return []
    const canvasRect: Rect = { x: 0, y: 0, w: dims.w, h: dims.h }
    const nodes = squarify(
      visibleSectors.map((s) => ({
        symbol: s.name,
        name: s.name,
        price: 0,
        changePercent: s.avgChangePercent,
        marketCap: s.totalMarketCap,
        sector: s.name,
        volume: 0,
      })),
      canvasRect
    )
    return nodes.map((n, i) => ({
      sector: visibleSectors[i] ?? visibleSectors[0],
      rect: { x: n.x, y: n.y, w: n.w, h: n.h },
    }))
  }, [visibleSectors, dims])

  const gainers = useMemo(() => {
    const flat = sectors.flatMap((s) => s.stocks)
    return flat.filter((s) => s.changePercent > 0).length
  }, [sectors])

  const losers = useMemo(() => {
    const flat = sectors.flatMap((s) => s.stocks)
    return flat.filter((s) => s.changePercent < 0).length
  }, [sectors])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel-strong)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Timeframe */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: timeframe === tf ? 'var(--accent)' : 'var(--panel-muted)',
                color: timeframe === tf ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Group by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Group by:</span>
          {(['sector', 'marketcap'] as GroupBy[]).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid',
                borderColor: groupBy === g ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
                background: groupBy === g ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                color: groupBy === g ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {g === 'sector' ? 'Sector' : 'Market Cap'}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Sector filter */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SECTORS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500,
                border: '1px solid',
                borderColor: activeSector === s ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
                background: activeSector === s ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--panel-muted)',
                color: activeSector === s ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} color="var(--green)" />
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{gainers}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown size={12} color="var(--red)" />
            <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>{losers}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Minus size={12} color="var(--text-secondary)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {sectors.flatMap((s) => s.stocks).length - gainers - losers}
            </span>
          </div>
        </div>

        <ColorLegend />

        <button
          onClick={refresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

        {updatedAt && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Heatmap canvas */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red)',
              fontSize: 14,
            }}
          >
            Error: {error}
          </div>
        )}

        {loading && !sectors.length && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} className="animate-spin" />
            Loading heatmap data…
          </div>
        )}

        {dims.w > 0 && dims.h > 0 && (
          <svg
            width={dims.w}
            height={dims.h}
            style={{ display: 'block' }}
          >
            {sectorRects.map(({ sector, rect }) => (
              <SectorBlock
                key={sector.name}
                sector={sector}
                rect={rect}
                gap={groupBy === 'sector' ? 3 : 2}
                onHover={handleHover}
              />
            ))}
          </svg>
        )}

        {tooltip && (
          <Tooltip
            stock={tooltip.stock}
            x={tooltip.x}
            y={tooltip.y}
            containerW={dims.w}
            containerH={dims.h}
          />
        )}
      </div>
    </div>
  )
}
