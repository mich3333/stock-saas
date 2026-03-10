'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/stat-card'
import { StockCard } from '@/components/stock/stock-card'
import { StockChart } from '@/components/charts/stock-chart'
import { NewsFeed } from '@/components/news/news-feed'
import { EarningsCalendar } from '@/components/earnings/earnings-calendar'
import { PortfolioTracker } from '@/components/portfolio/portfolio-tracker'
import { DraggableGrid, DashboardWidget } from '@/components/dashboard/draggable-grid'
import { Search, BarChart2, Activity } from 'lucide-react'
import type { QuoteData, ChartPoint } from '@/types'

const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX']

interface MarketIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePercent: number
  isPositive: boolean
}

interface StockData {
  symbol: string
  quote: QuoteData
  history: ChartPoint[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [watchlistId, setWatchlistId] = useState<string | null>(null)
  const [watchlistItems, setWatchlistItems] = useState<{ id: string; symbol: string }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragMode, setIsDragMode] = useState(false)
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const res = await fetch('/api/watchlist')
      const { data } = await res.json()
      if (data && data.length > 0) {
        setWatchlistId(data[0].id)
        setWatchlistItems((data[0].watchlist_items || []).map((i: { id: string; symbol: string }) => ({ id: i.id, symbol: i.symbol })))
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await fetch('/api/indices')
        if (res.ok) {
          const { indices } = await res.json()
          setMarketIndices(indices || [])
        }
      } catch (error) {
        console.error('Failed to fetch indices:', error)
      } finally {
        setIndicesLoading(false)
      }
    }
    fetchIndices()
  }, [])

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const results = await Promise.allSettled(
          POPULAR_SYMBOLS.map(async (symbol) => {
            const res = await fetch(`/api/stocks/${symbol}`)
            if (!res.ok) throw new Error(`Failed to fetch ${symbol}`)
            const data = await res.json()
            return { symbol, ...data } as StockData
          })
        )
        const successful = results
          .filter((r): r is PromiseFulfilledResult<StockData> => r.status === 'fulfilled')
          .map((r) => r.value)
        setStocks(successful)
      } catch (error) {
        console.error('Failed to fetch stocks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStocks()
  }, [])

  const selectedStock = stocks.find((s) => s.symbol === selectedSymbol)

  const filteredStocks = searchQuery
    ? stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.quote.shortName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stocks

  const toggleWatchlist = async (symbol: string) => {
    const existing = watchlistItems.find((i) => i.symbol === symbol)
    if (existing) {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existing.id }),
      })
      setWatchlistItems((prev) => prev.filter((i) => i.symbol !== symbol))
    } else {
      if (!watchlistId) return
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, watchlist_id: watchlistId }),
      })
      const { data } = await res.json()
      if (data) setWatchlistItems((prev) => [...prev, { id: data.id, symbol: data.symbol }])
    }
  }

  // Dashboard widgets
  const widgets: DashboardWidget[] = [
    {
      id: 'market-overview',
      label: 'Market Overview',
      content: (
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-semibold mb-4"
            style={{ color: '#D1D4DC' }}
          >
            Market Overview
          </motion.h2>
          {indicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl h-24 animate-pulse"
                  style={{ background: '#1E222D', border: '1px solid #2A2E39' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketIndices.map((idx, i) => (
                <StatCard
                  key={idx.symbol}
                  title={idx.name}
                  value={idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  change={`${idx.isPositive ? '+' : ''}${idx.changePercent.toFixed(2)}%`}
                  isPositive={idx.isPositive}
                  delay={i * 0.1}
                  icon={<BarChart2 size={18} />}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'stock-chart',
      label: 'Stock Chart',
      content: selectedStock ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <StockChart
            data={selectedStock.history}
            symbol={selectedStock.symbol}
            isPositive={(selectedStock.quote.regularMarketChange ?? 0) >= 0}
          />
        </motion.div>
      ) : null,
    },
    {
      id: 'stock-grid',
      label: 'Popular Stocks',
      content: (
        <div>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={18}
              style={{ color: '#787B86' }}
            />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm"
              style={{
                background: '#1E222D',
                border: '1px solid #2A2E39',
                color: '#D1D4DC',
              }}
            />
          </div>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold mb-4 flex items-center gap-2"
            style={{ color: '#D1D4DC' }}
          >
            <Activity size={20} style={{ color: '#2962FF' }} />
            Popular Stocks
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {POPULAR_SYMBOLS.map((s) => (
                <div
                  key={s}
                  className="rounded-2xl h-44 animate-pulse"
                  style={{ background: '#1E222D', border: '1px solid #2A2E39' }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredStocks.map((stock, i) => (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedSymbol(stock.symbol === selectedSymbol ? null : stock.symbol)}
                >
                  <StockCard
                    symbol={stock.symbol}
                    name={stock.quote.shortName ?? stock.symbol}
                    price={stock.quote.regularMarketPrice ?? 0}
                    change={stock.quote.regularMarketChange ?? 0}
                    changePercent={stock.quote.regularMarketChangePercent ?? 0}
                    volume={stock.quote.regularMarketVolume ?? 0}
                    marketCap={stock.quote.marketCap}
                    pe={null}
                    high52w={stock.quote.fiftyTwoWeekHigh ?? 0}
                    low52w={stock.quote.fiftyTwoWeekLow ?? 0}
                    index={i}
                    onAdd={toggleWatchlist}
                    inWatchlist={watchlistItems.some((item) => item.symbol === stock.symbol)}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredStocks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
              style={{ color: '#787B86' }}
            >
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No stocks found for &quot;{searchQuery}&quot;</p>
            </motion.div>
          )}
        </div>
      ),
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      content: <PortfolioTracker />,
    },
    {
      id: 'news',
      label: 'News',
      content: (
        <NewsFeed symbol={selectedSymbol ?? 'AAPL'} />
      ),
    },
    {
      id: 'earnings',
      label: 'Earnings Calendar',
      content: <EarningsCalendar />,
    },
  ].filter((w) => w.id !== 'stock-chart' || selectedStock != null)

  return (
    <div className="min-h-screen" style={{ background: '#131722' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 py-6"
      >
        <DraggableGrid widgets={widgets} isDragMode={isDragMode} />
      </motion.div>
    </div>
  )
}
