'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvidedDragHandleProps,
} from '@hello-pangea/dnd'
import { useWatchlist, WatchItem, CATEGORY_MAP, SYMBOL_DISPLAY, TV_TO_APP_SYMBOL } from '@/hooks/useWatchlist'

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
    <div
      style={{
        padding: '0.25rem 0.5rem 0.28rem',
        borderBottom: '1px solid #2a2e39',
        background: '#161a25',
      }}
    >
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
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
          className="tv-watchlist-search"
          style={{
            flex: 1,
            paddingLeft: '0.45rem',
            paddingRight: '0.45rem',
            paddingTop: '0.18rem',
            paddingBottom: '0.18rem',
            fontSize: '0.68rem',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !value.trim()}
          style={{
            padding: '0.2rem 0.55rem',
            fontSize: '0.68rem',
            borderRadius: 4,
            fontWeight: 600,
            border: 'none',
            cursor: adding || !value.trim() ? 'not-allowed' : 'pointer',
            opacity: adding || !value.trim() ? 0.5 : 1,
            background: '#2962FF',
            color: '#fff',
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
        >
          {adding ? '...' : 'Add'}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 8.5, color: '#EF5350', margin: '0.22rem 0 0', paddingLeft: 2 }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface RowProps {
  item: WatchItem
  flash: 'up' | 'down' | null
  isDragging: boolean
  dragHandleProps: DraggableProvidedDragHandleProps | null
  onRemove: (symbol: string) => void
  onSelect: (item: WatchItem) => void
  isActive: boolean
}

function formatPrice(value: number) {
  if (value === 0) return '—'
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return value.toFixed(2)
}

function WatchRow({ item, flash, isDragging, dragHandleProps, onRemove, onSelect, isActive }: RowProps) {
  const isPositive = item.changePct >= 0
  const changeColor = isPositive ? '#26A69A' : '#EF5350'

  const formattedPrice = formatPrice(item.price)
  const formattedChange = item.price === 0 && item.change === 0 ? '—' : `${isPositive ? '+' : ''}${item.change.toFixed(2)}`
  const formattedChangePct = item.price === 0 && item.changePct === 0 ? '—' : `${isPositive ? '+' : ''}${item.changePct.toFixed(2)}%`
  const displaySymbol = SYMBOL_DISPLAY[item.symbol] ?? item.symbol

  return (
    <div
      {...(dragHandleProps ?? {})}
      className={`watchlist-row tv-watch-row${flash === 'up' ? ' tv-flash-up' : flash === 'down' ? ' tv-flash-down' : ''}`}
      onClick={() => onSelect(item)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 70px 64px 68px',
        alignItems: 'center',
        minHeight: 28,
        padding: '0 20px 0 6px',
        borderBottom: '1px solid #2a2e39',
        background: isDragging ? 'rgba(255,255,255,0.03)' : isActive ? 'rgba(41,98,255,0.14)' : 'transparent',
        transition: isDragging ? 'none' : 'background 140ms ease',
        position: 'relative',
        cursor: 'pointer',
      }}
      title={`${displaySymbol}${item.name ? ` • ${item.name}` : ''}`}
    >
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          className="tv-watch-symbol"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isActive ? '#f8fafc' : '#D1D4DC',
            letterSpacing: '0.01em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displaySymbol}
        </span>
        {item.stale && (
          <span title="Data may be stale" style={{ fontSize: 7, color: '#787B86', lineHeight: 1 }}>
            ●
          </span>
        )}
      </div>

      <div
        className="tv-watch-price tv-num"
        style={{
          textAlign: 'right',
          fontSize: 12,
          fontWeight: 600,
          color: '#D1D4DC',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          justifySelf: 'end',
        }}
      >
        {formattedPrice}
      </div>

      <div
        className="tv-watch-change"
        style={{
          textAlign: 'right',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          justifySelf: 'end',
          color: changeColor,
        }}
      >
        {formattedChange}
      </div>

      <div
        className={`tv-watch-pct ${isPositive ? 'up' : 'down'}`}
        style={{
          textAlign: 'right',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          justifySelf: 'end',
        }}
      >
        {formattedChangePct}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.symbol)
        }}
        title={`Remove ${item.symbol}`}
        className="watchlist-remove-btn tv-watch-remove"
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0.1rem',
          borderRadius: 3,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: '#787B86',
          opacity: 0,
          transition: 'opacity 0.15s, color 0.15s',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={9} />
      </button>
    </div>
  )
}

function formatPreviewPrice(value: number) {
  if (value === 0) return '—'
  return value >= 1000
    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toFixed(2)
}

interface WatchlistProps {
  collapsed: boolean
  onToggle: () => void
  side?: 'left' | 'right'
}

export function Watchlist({ collapsed, onToggle, side = 'left' }: WatchlistProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { items, loading, refreshing, flashMap, addSymbol, removeSymbol, reorder, refresh } =
    useWatchlist()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [manualSelectedSymbol, setManualSelectedSymbol] = useState<string | null>(null)

  const appToTvSymbol = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(TV_TO_APP_SYMBOL).map(([tvSymbol, appSymbol]) => [appSymbol, tvSymbol])
      ) as Record<string, string>,
    []
  )

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

  const routeSelectedSymbol = useMemo(() => {
    if (!pathname.startsWith('/symbol/')) return null
    const currentSymbol = decodeURIComponent(pathname.split('/').pop() ?? '').toUpperCase()
    return appToTvSymbol[currentSymbol] ?? null
  }, [pathname, appToTvSymbol])

  const selectedSymbol = routeSelectedSymbol ?? manualSelectedSymbol

  const selectedItem = useMemo(
    () => items.find((item) => item.symbol === selectedSymbol) ?? null,
    [items, selectedSymbol]
  )

  const openSymbol = useCallback(
    (item: WatchItem) => {
      const appSymbol = TV_TO_APP_SYMBOL[item.symbol] ?? (SYMBOL_DISPLAY[item.symbol] ?? item.symbol).replace(/USDT$/, 'USD')
      setManualSelectedSymbol(item.symbol)
      router.push(`/symbol/${encodeURIComponent(appSymbol)}`)
    },
    [router]
  )

  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          gap: '0.45rem',
          width: 34,
          height: '100%',
          background: '#1e222d',
          borderRight: side === 'left' ? '1px solid #2a2e39' : 'none',
          borderLeft: side === 'right' ? '1px solid #2a2e39' : 'none',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggle}
          title="Expand watchlist"
          style={{
            padding: '0.16rem',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: '#787B86',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={13} />
        </button>
        {items.slice(0, 12).map((item) => {
          const isPositive = item.changePct >= 0
          return (
            <div
              key={item.symbol}
              title={`${item.symbol}  ${item.price > 0 ? item.price.toFixed(2) : '—'}  (${isPositive ? '+' : ''}${item.changePct.toFixed(2)}%)`}
            >
              <p
                style={{
                  fontSize: 7.5,
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

  return (
    <>
      <style>{`
        .watchlist-row:hover .watchlist-remove-btn { opacity: 1 !important; }
        @keyframes wl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wl-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        .wl-skeleton { animation: wl-pulse 1.5s ease-in-out infinite; }
        .watchlist-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      <div
        className="tv-watchlist"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: 250,
          background: '#1e222d',
          borderRight: side === 'left' ? '1px solid #2a2e39' : 'none',
          borderLeft: side === 'right' ? '1px solid #2a2e39' : 'none',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <div
          className="tv-watchlist-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0.4rem',
            height: 32,
            borderBottom: '1px solid #2a2e39',
            flexShrink: 0,
            background: '#1e222d',
          }}
        >
          <span
            className="tv-watchlist-title"
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'none',
              color: '#D1D4DC',
            }}
          >
            Watchlist
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              onClick={refresh}
              disabled={refreshing}
              title="Refresh prices"
              style={{
                padding: '0.16rem',
                borderRadius: 4,
                border: 'none',
                cursor: refreshing ? 'default' : 'pointer',
                background: 'transparent',
                color: '#787B86',
                display: 'flex',
                alignItems: 'center',
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw
                size={10}
                style={{
                  animation: refreshing ? 'wl-spin 0.8s linear infinite' : 'none',
                }}
              />
            </button>
            <button
              onClick={() => setShowAdd((v) => !v)}
              title="Add symbol"
              style={{
                padding: '0.16rem',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: showAdd ? '#2962FF' : '#787B86',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Plus size={10} />
            </button>
            <button
              onClick={onToggle}
              title="Collapse watchlist"
              style={{
                padding: '0.16rem',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#787B86',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={10} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0.26rem 0.45rem 0.28rem', borderBottom: '1px solid #2a2e39' }}>
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
              className="tv-watchlist-search"
              style={{
                width: '100%',
                paddingLeft: '1.25rem',
                paddingRight: '0.45rem',
                paddingTop: '0.18rem',
                paddingBottom: '0.18rem',
                fontSize: '0.68rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {showAdd && <AddSymbolForm onAdd={addSymbol} onClose={() => setShowAdd(false)} />}

        {!loading && items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 70px 64px 68px',
              alignItems: 'center',
              padding: '0.18rem 0.5rem 0.16rem 0.5rem',
              borderBottom: '1px solid #2a2e39',
              flexShrink: 0,
              position: 'sticky',
              top: 0,
              zIndex: 3,
              background: '#161a25',
              boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
            }}
          >
            <span style={{ fontSize: 8, color: '#787b86', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Symbol
            </span>
            <span style={{ fontSize: 8, color: '#787b86', textAlign: 'right', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Last
            </span>
            <span style={{ fontSize: 8, color: '#787b86', textAlign: 'right', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Chg
            </span>
            <span style={{ fontSize: 8, color: '#787b86', textAlign: 'right', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Chg%
            </span>
          </div>
        )}

        {loading && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 70px 64px 68px',
                  alignItems: 'center',
                  padding: '0.2rem 0.5rem',
                  borderBottom: '1px solid #2a2e39',
                  opacity: 1 - i * 0.1,
                }}
              >
                <div className="wl-skeleton tv-skeleton" style={{ width: '42%', height: 8, borderRadius: 3, background: '#232938' }} />
                <div className="wl-skeleton tv-skeleton" style={{ width: 46, height: 8, borderRadius: 3, background: '#232938', justifySelf: 'end' }} />
                <div className="wl-skeleton tv-skeleton" style={{ width: 40, height: 8, borderRadius: 3, background: '#232938', justifySelf: 'end' }} />
                <div className="wl-skeleton tv-skeleton" style={{ width: 44, height: 8, borderRadius: 3, background: '#232938', justifySelf: 'end' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="tv-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#1e222d' }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="watchlist">
                {(droppableProvided) => (
                  <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                    {displayed.length === 0 ? (
                      <div
                        style={{
                          padding: '1.35rem 0.9rem',
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
                    ) : (() => {
                      const nodes: React.ReactNode[] = []
                      let lastCat: string | null = null
                      let dragIdx = 0

                      for (const item of displayed) {
                        const cat = search ? null : (CATEGORY_MAP[item.symbol] ?? null)
                        if (cat && cat !== lastCat) {
                          nodes.push(
                            <div key={`cat-${cat}`} className="tv-category-header">
                              {cat}
                            </div>
                          )
                          lastCat = cat
                        }

                        const currentIdx = dragIdx++
                        nodes.push(
                          <Draggable key={item.symbol} draggableId={item.symbol} index={currentIdx}>
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
                                  onSelect={openSymbol}
                                  isActive={selectedSymbol === item.symbol}
                                />
                              </div>
                            )}
                          </Draggable>
                        )
                      }

                      return nodes
                    })()}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        <div
          style={{
            borderTop: '1px solid #2a2e39',
            background: selectedItem ? 'linear-gradient(180deg, rgba(18,25,40,0.96) 0%, rgba(13,18,28,0.98) 100%)' : '#161a25',
            padding: selectedItem ? '0.55rem 0.55rem 0.6rem' : '0.5rem 0.55rem',
            minHeight: selectedItem ? 96 : 48,
            transform: selectedItem ? 'translateY(0)' : 'translateY(0)',
            transition: 'min-height 160ms ease, background 160ms ease',
            flexShrink: 0,
          }}
        >
          {selectedItem ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                      {SYMBOL_DISPLAY[selectedItem.symbol] ?? selectedItem.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 5px',
                        borderRadius: 999,
                        background: '#222838',
                        color: '#787b86',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {CATEGORY_MAP[selectedItem.symbol] ?? 'MARKET'}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#787b86', lineHeight: 1.45 }}>
                    {selectedItem.name || 'Selected market'}
                  </div>
                </div>
                <button
                  onClick={() => openSymbol(selectedItem)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    border: '1px solid #2a2e39',
                    borderRadius: 6,
                    background: '#131722',
                    color: '#d1d4dc',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '0.3rem 0.45rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Open
                  <ArrowUpRight size={11} />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 9, color: '#787b86', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                    {formatPreviewPrice(selectedItem.price)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#787b86', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Change</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedItem.change >= 0 ? '#26A69A' : '#EF5350', marginTop: 2 }}>
                    {selectedItem.change >= 0 ? '+' : ''}{selectedItem.change.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#787b86', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chg%</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: selectedItem.changePct >= 0 ? '#26A69A' : '#EF5350', marginTop: 2 }}>
                    {selectedItem.changePct >= 0 ? '+' : ''}{selectedItem.changePct.toFixed(2)}%
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 10, color: '#787b86', lineHeight: 1.5 }}>
              Select any symbol in the watchlist to open it and pin a quick preview here.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
