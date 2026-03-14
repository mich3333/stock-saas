'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Search,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  RefreshCw,
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { useWatchlist, WatchItem } from '@/hooks/useWatchlist'

// ─── Mini Sparkline SVG ──────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null

  const w = 52
  const h = 22
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const xScale = (i: number) => (i / (data.length - 1)) * w
  const yScale = (v: number) => h - ((v - min) / range) * (h - 3) - 1.5

  const linePts = data.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')
  const fillD =
    `M${xScale(0).toFixed(1)},${h} ` +
    data.map((v, i) => `L${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ') +
    ` L${xScale(data.length - 1).toFixed(1)},${h} Z`

  const color = positive ? '#26A69A' : '#EF5350'
  const fillColor = positive ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0, display: 'block' }}>
      <path d={fillD} fill={fillColor} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Add Symbol Form ─────────────────────────────────────────────────────────

interface AddFormProps {
  onAdd: (sym: string) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
}

function AddSymbolForm({ onAdd, onClose }: AddFormProps) {
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleAdd = async () => {
    const sym = value.trim().toUpperCase()
    if (!sym) return
    setAdding(true)
    setError(null)
    const result = await onAdd(sym)
    if (result.success) {
      onClose()
    } else {
      setError(result.error ?? 'Failed to add symbol')
      setAdding(false)
    }
  }

  return (
    <div style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #2A2E39' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Symbol (e.g. AAPL)"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
            if (e.key === 'Escape') onClose()
          }}
          style={{
            flex: 1,
            padding: '0.28rem 0.5rem',
            fontSize: '0.7rem',
            borderRadius: 4,
            background: '#131722',
            border: '1px solid #2962FF',
            color: '#D1D4DC',
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !value.trim()}
          style={{
            padding: '0.28rem 0.55rem',
            fontSize: '0.7rem',
            borderRadius: 4,
            fontWeight: 600,
            border: 'none',
            cursor: adding || !value.trim() ? 'not-allowed' : 'pointer',
            opacity: adding || !value.trim() ? 0.5 : 1,
            background: '#2962FF',
            color: '#fff',
            transition: 'opacity 0.15s',
          }}
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 9, color: '#EF5350', margin: '0.2rem 0 0', paddingLeft: 2 }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Single Watchlist Row ─────────────────────────────────────────────────────

interface RowProps {
  item: WatchItem
  flash: 'up' | 'down' | null
  isDragging: boolean
  dragHandleProps: DraggableProvidedDragHandleProps | null
  onRemove: (symbol: string) => void
}

function WatchRow({ item, flash, isDragging, dragHandleProps, onRemove }: RowProps) {
  const isPositive = item.changePct >= 0
  const priceColor = isPositive ? '#26A69A' : '#EF5350'

  const bg = isDragging
    ? '#2A2E39'
    : flash === 'up'
    ? 'rgba(38,166,154,0.13)'
    : flash === 'down'
    ? 'rgba(239,83,80,0.13)'
    : 'transparent'

  const formattedPrice =
    item.price === 0
      ? '—'
      : item.price >= 1000
      ? item.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : item.price.toFixed(2)

  const formattedChange =
    item.change === 0 && item.price === 0
      ? ''
      : `${isPositive ? '+' : ''}${item.change.toFixed(2)}`

  const formattedChangePct =
    item.changePct === 0 && item.price === 0
      ? '—'
      : `${isPositive ? '+' : ''}${item.changePct.toFixed(2)}%`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.42rem 0.5rem 0.42rem 0.4rem',
        borderBottom: '1px solid #2A2E39',
        background: bg,
        transition: isDragging ? 'none' : 'background 0.35s ease',
        gap: 3,
        position: 'relative',
      }}
      className="watchlist-row"
    >
      {/* Drag handle */}
      <div
        {...(dragHandleProps ?? {})}
        style={{
          color: '#1E222D',
          cursor: 'grab',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.color = '#787B86'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.color = '#1E222D'
        }}
      >
        <GripVertical size={10} />
      </div>

      {/* Symbol + name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#D1D4DC',
              letterSpacing: '0.02em',
            }}
          >
            {item.symbol}
          </span>
          {isPositive ? (
            <TrendingUp size={9} style={{ color: '#26A69A', flexShrink: 0 }} />
          ) : (
            <TrendingDown size={9} style={{ color: '#EF5350', flexShrink: 0 }} />
          )}
          {item.stale && (
            <span
              title="Data may be stale"
              style={{ fontSize: 7, color: '#787B86', lineHeight: 1 }}
            >
              ●
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 9,
            color: '#787B86',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 64,
          }}
        >
          {item.name}
        </p>
      </div>

      {/* Sparkline */}
      {item.sparkline && item.sparkline.length > 1 && (
        <div style={{ marginLeft: 2, marginRight: 2 }}>
          <Sparkline data={item.sparkline} positive={isPositive} />
        </div>
      )}

      {/* Price block */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 42 }}>
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: '#D1D4DC',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {formattedPrice}
        </p>
        <p
          style={{
            fontSize: 9,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: priceColor,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {formattedChangePct}
        </p>
        {formattedChange && (
          <p
            style={{
              fontSize: 9,
              fontVariantNumeric: 'tabular-nums',
              color: '#787B86',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {formattedChange}
          </p>
        )}
      </div>

      {/* Remove button — revealed on row hover via CSS */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.symbol)
        }}
        title={`Remove ${item.symbol}`}
        style={{
          marginLeft: 2,
          padding: '0.125rem',
          borderRadius: 3,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: '#787B86',
          opacity: 0,
          transition: 'opacity 0.15s, color 0.15s',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        className="watchlist-remove-btn"
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.color = '#EF5350'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.color = '#787B86'
        }}
      >
        <X size={9} />
      </button>
    </div>
  )
}

// ─── Main Watchlist Component ────────────────────────────────────────────────

interface WatchlistProps {
  collapsed: boolean
  onToggle: () => void
}

export function Watchlist({ collapsed, onToggle }: WatchlistProps) {
  const { items, loading, refreshing, flashMap, addSymbol, removeSymbol, reorder, refresh } =
    useWatchlist()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return
      reorder(result.source.index, result.destination.index)
    },
    [reorder]
  )

  const displayed = search
    ? items.filter(
        (i) =>
          i.symbol.toLowerCase().includes(search.toLowerCase()) ||
          i.name.toLowerCase().includes(search.toLowerCase())
      )
    : items

  // ── Collapsed sidebar ────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          gap: '0.6rem',
          width: 36,
          height: '100%',
          background: '#1E222D',
          borderRight: '1px solid #2A2E39',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggle}
          title="Expand watchlist"
          style={{
            padding: '0.2rem',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: '#787B86',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = '#D1D4DC'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.color = '#787B86'
          }}
        >
          <ChevronRight size={14} />
        </button>
        {items.slice(0, 12).map((item) => {
          const isPositive = item.changePct >= 0
          return (
            <div
              key={item.symbol}
              title={`${item.symbol}  $${item.price > 0 ? item.price.toFixed(2) : '—'}  (${isPositive ? '+' : ''}${item.changePct.toFixed(2)}%)`}
            >
              <p
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: isPositive ? '#26A69A' : '#EF5350',
                  writingMode: 'vertical-lr',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {item.symbol}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Expanded sidebar ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .watchlist-row:hover .watchlist-remove-btn { opacity: 1 !important; }
        @keyframes wl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wl-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        .wl-skeleton { animation: wl-pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: 240,
          background: '#1E222D',
          borderRight: '1px solid #2A2E39',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0.5rem',
            height: 36,
            borderBottom: '1px solid #2A2E39',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#787B86',
            }}
          >
            Watchlist
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Refresh prices"
              style={{
                padding: '0.2rem',
                borderRadius: 4,
                border: 'none',
                cursor: refreshing ? 'default' : 'pointer',
                background: 'transparent',
                color: '#787B86',
                display: 'flex',
                alignItems: 'center',
                opacity: refreshing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!refreshing) (e.currentTarget as HTMLElement).style.color = '#D1D4DC'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = '#787B86'
              }}
            >
              <RefreshCw
                size={11}
                style={{
                  animation: refreshing ? 'wl-spin 0.8s linear infinite' : 'none',
                }}
              />
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              title="Add symbol"
              style={{
                padding: '0.2rem',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: showAdd ? '#2962FF' : '#787B86',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = '#D1D4DC'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = showAdd ? '#2962FF' : '#787B86'
              }}
            >
              <Plus size={12} />
            </button>
            <button
              onClick={onToggle}
              title="Collapse watchlist"
              style={{
                padding: '0.2rem',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#787B86',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = '#D1D4DC'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = '#787B86'
              }}
            >
              <ChevronLeft size={12} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '0.35rem 0.5rem',
            borderBottom: '1px solid #2A2E39',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={10}
              style={{
                position: 'absolute',
                left: 7,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#787B86',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search symbols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '1.35rem',
                paddingRight: '0.4rem',
                paddingTop: '0.28rem',
                paddingBottom: '0.28rem',
                fontSize: '0.68rem',
                borderRadius: 4,
                background: '#131722',
                border: '1px solid #2A2E39',
                color: '#D1D4DC',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = '#2962FF'
              }}
              onBlur={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = '#2A2E39'
              }}
            />
          </div>
        </div>

        {/* Add symbol form */}
        {showAdd && (
          <AddSymbolForm onAdd={addSymbol} onClose={() => setShowAdd(false)} />
        )}

        {/* Column labels */}
        {!loading && items.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.15rem 0.5rem 0.15rem 1.2rem',
              borderBottom: '1px solid #2A2E39',
              flexShrink: 0,
              gap: 3,
            }}
          >
            <span style={{ flex: 1, fontSize: 8, color: '#4A4E5A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Symbol
            </span>
            <span style={{ fontSize: 8, color: '#4A4E5A', marginRight: 60, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Chart
            </span>
            <span style={{ fontSize: 8, color: '#4A4E5A', textAlign: 'right', minWidth: 42, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Price
            </span>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.45rem 0.6rem',
                  borderBottom: '1px solid #2A2E39',
                  gap: 8,
                  opacity: 1 - i * 0.1,
                }}
              >
                <div className="wl-skeleton" style={{ width: 8, height: 10, borderRadius: 2, background: '#2A2E39' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="wl-skeleton" style={{ width: '45%', height: 8, borderRadius: 3, background: '#2A2E39' }} />
                  <div className="wl-skeleton" style={{ width: '65%', height: 7, borderRadius: 3, background: '#2A2E39', opacity: 0.6 }} />
                </div>
                <div className="wl-skeleton" style={{ width: 52, height: 18, borderRadius: 3, background: '#2A2E39' }} />
                <div className="wl-skeleton" style={{ width: 36, height: 28, borderRadius: 3, background: '#2A2E39' }} />
              </div>
            ))}
          </div>
        )}

        {/* Drag-and-drop list */}
        {!loading && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="watchlist">
                {(droppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {displayed.map((item, index) => (
                      <Draggable
                        key={item.symbol}
                        draggableId={item.symbol}
                        index={index}
                      >
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            style={draggableProvided.draggableProps.style}
                          >
                            <WatchRow
                              item={item}
                              flash={flashMap[item.symbol] ?? null}
                              isDragging={snapshot.isDragging}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              onRemove={removeSymbol}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                    {displayed.length === 0 && (
                      <div
                        style={{
                          padding: '2rem 1rem',
                          textAlign: 'center',
                          fontSize: 11,
                          color: '#787B86',
                          lineHeight: 1.6,
                        }}
                      >
                        {search ? (
                          <>No symbols match &quot;{search}&quot;</>
                        ) : (
                          <>
                            Your watchlist is empty.
                            <br />
                            <button
                              onClick={() => setShowAdd(true)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2962FF',
                                cursor: 'pointer',
                                fontSize: 11,
                                marginTop: 4,
                              }}
                            >
                              + Add a symbol
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div
            style={{
              padding: '0.3rem 0.6rem',
              borderTop: '1px solid #2A2E39',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 9, color: '#4A4E5A' }}>
              {items.length} symbol{items.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 9, color: '#4A4E5A' }}>auto-refresh 30s</span>
          </div>
        )}
      </div>
    </>
  )
}
