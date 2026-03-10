'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface WatchItem {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
}

const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'BTC-USD', 'ETH-USD', 'SPY']

const INITIAL_WATCHLIST: WatchItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 2.15, changePct: 1.14 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.61, change: -8.43, changePct: -3.28 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 175.98, change: 3.41, changePct: 1.98 },
  { symbol: 'MSFT', name: 'Microsoft', price: 418.52, change: -1.23, changePct: -0.29 },
  { symbol: 'AMZN', name: 'Amazon', price: 204.39, change: 1.87, changePct: 0.92 },
  { symbol: 'META', name: 'Meta Platforms', price: 524.77, change: -4.32, changePct: -0.82 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.39, change: 22.14, changePct: 2.59 },
  { symbol: 'BTC', name: 'Bitcoin', price: 67420.50, change: 1243.80, changePct: 1.88 },
  { symbol: 'ETH', name: 'Ethereum', price: 3542.30, change: -87.40, changePct: -2.41 },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 512.47, change: 3.21, changePct: 0.63 },
]

function simulatePriceChange(item: WatchItem): WatchItem {
  const delta = item.price * (Math.random() - 0.5) * 0.002
  const newPrice = Math.max(item.price + delta, 0.01)
  const newChange = item.change + delta * 0.5
  const newChangePct = item.changePct + (Math.random() - 0.5) * 0.05
  return { ...item, price: newPrice, change: newChange, changePct: newChangePct }
}

interface WatchlistProps {
  collapsed: boolean
  onToggle: () => void
}

export function Watchlist({ collapsed, onToggle }: WatchlistProps) {
  const [items, setItems] = useState<WatchItem[]>(INITIAL_WATCHLIST)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addSymbol, setAddSymbol] = useState('')
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down' | null>>({})

  // Fetch real prices from Yahoo Finance on mount
  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        const results = await Promise.all(
          DEFAULT_SYMBOLS.map(async (sym) => {
            const res = await fetch(`/api/stocks/${sym}`)
            if (!res.ok) return null
            const data = await res.json()
            return {
              symbol: sym.replace('-USD', ''),
              name: data.shortName ?? sym,
              price: data.regularMarketPrice ?? 0,
              change: data.regularMarketChange ?? 0,
              changePct: data.regularMarketChangePercent ?? 0,
            } as WatchItem
          })
        )
        const valid = results.filter(Boolean) as WatchItem[]
        if (valid.length > 0) setItems(valid)
      } catch {
        // keep initial fallback data
      }
    }
    fetchRealPrices()
  }, [])

  // Simulate live price updates every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => {
        const next = prev.map(item => {
          const updated = simulatePriceChange(item)
          const direction = updated.price > item.price ? 'up' : 'down'
          setFlashMap(f => ({ ...f, [item.symbol]: direction }))
          setTimeout(() => setFlashMap(f => ({ ...f, [item.symbol]: null })), 600)
          return updated
        })
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filtered = search
    ? items.filter(i => i.symbol.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  const addStock = useCallback(() => {
    const sym = addSymbol.trim().toUpperCase()
    if (!sym || items.find(i => i.symbol === sym)) return
    const newItem: WatchItem = {
      symbol: sym,
      name: sym,
      price: 100 + Math.random() * 400,
      change: (Math.random() - 0.5) * 10,
      changePct: (Math.random() - 0.5) * 5,
    }
    setItems(prev => [...prev, newItem])
    setAddSymbol('')
    setShowAdd(false)
  }, [addSymbol, items])

  const removeStock = useCallback((symbol: string) => {
    setItems(prev => prev.filter(i => i.symbol !== symbol))
  }, [])

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center py-4 gap-3 cursor-pointer"
        style={{ width: 40, background: '#1E222D', borderRight: '1px solid #2A2E39' }}
      >
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC] transition-colors"
          title="Expand watchlist"
        >
          <ChevronRight size={16} />
        </button>
        {filtered.slice(0, 8).map(item => (
          <div key={item.symbol} className="text-center" title={`${item.symbol}: $${item.price.toFixed(2)}`}>
            <p className="text-[9px] font-bold text-[#D1D4DC]" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
              {item.symbol}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 240, background: '#1E222D', borderRight: '1px solid #2A2E39', flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: '1px solid #2A2E39' }}>
        <span className="text-xs font-semibold tracking-wider text-[#787B86] uppercase">Watchlist</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(v => !v)}
            className="p-1 rounded hover:bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC] transition-colors"
            title="Add symbol"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC] transition-colors"
            title="Collapse watchlist"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2" style={{ borderBottom: '1px solid #2A2E39' }}>
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#787B86]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 text-xs rounded"
            style={{ background: '#131722', border: '1px solid #2A2E39', color: '#D1D4DC', outline: 'none' }}
          />
        </div>
      </div>

      {/* Add input */}
      {showAdd && (
        <div className="px-2 py-2" style={{ borderBottom: '1px solid #2A2E39' }}>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="Symbol (e.g. AAPL)"
              value={addSymbol}
              onChange={e => setAddSymbol(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStock()}
              autoFocus
              className="flex-1 px-2 py-1 text-xs rounded"
              style={{ background: '#131722', border: '1px solid #2962FF', color: '#D1D4DC', outline: 'none' }}
            />
            <button
              onClick={addStock}
              className="px-2 py-1 text-xs rounded font-medium"
              style={{ background: '#2962FF', color: '#fff' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(item => {
          const isPositive = item.changePct >= 0
          const flash = flashMap[item.symbol]
          return (
            <div
              key={item.symbol}
              className="group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
              style={{
                borderBottom: '1px solid #2A2E39',
                background: flash === 'up' ? 'rgba(38,166,154,0.12)' : flash === 'down' ? 'rgba(239,83,80,0.12)' : 'transparent',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#131722')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold" style={{ color: '#D1D4DC' }}>{item.symbol}</span>
                  {isPositive
                    ? <TrendingUp size={9} style={{ color: '#26a69a' }} />
                    : <TrendingDown size={9} style={{ color: '#ef5350' }} />
                  }
                </div>
                <p className="text-[10px] truncate" style={{ color: '#787B86' }}>{item.name}</p>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="text-xs font-medium tabular-nums" style={{ color: '#D1D4DC' }}>
                  {item.price >= 1000 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : item.price.toFixed(2)}
                </p>
                <p className="text-[10px] font-medium tabular-nums" style={{ color: isPositive ? '#26a69a' : '#ef5350' }}>
                  {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeStock(item.symbol) }}
                className="ml-1 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                style={{ color: '#787B86' }}
              >
                <X size={10} />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[10px]" style={{ color: '#787B86' }}>
            No symbols found
          </div>
        )}
      </div>
    </div>
  )
}
