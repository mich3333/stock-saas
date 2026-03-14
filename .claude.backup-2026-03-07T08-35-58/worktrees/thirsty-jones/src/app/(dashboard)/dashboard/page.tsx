'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/stat-card'
import { StockCard } from '@/components/stock/stock-card'
import { StockChart } from '@/components/charts/stock-chart'
import { NewsFeed } from '@/components/news/news-feed'
import { EarningsCalendar } from '@/components/earnings/earnings-calendar'
import { DraggableGrid, DashboardWidget } from '@/components/dashboard/draggable-grid'
import { TrendingUp, Search, Bell, LogOut, BarChart2, Activity, LayoutDashboard, Check } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import type { QuoteData, ChartPoint } from '@/types'

const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX']

const MARKET_INDICES = [
  { name: 'S&P 500', value: '4,783.45', change: '+1.2%', isPositive: true },
  { name: 'NASDAQ', value: '16,542.11', change: '+0.85%', isPositive: true },
  { name: 'DOW JONES', value: '38,120.75', change: '-0.23%', isPositive: false },
]

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

  const navRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const navHeight = useTransform(scrollY, [0, 80], [64, 52])
  const navShadow = useTransform(scrollY, [0, 80], ['0 0px 0px rgba(0,0,0,0)', '0 4px 24px rgba(0,0,0,0.08)'])

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Market Overview
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MARKET_INDICES.map((idx, i) => (
              <StatCard
                key={idx.name}
                title={idx.name}
                value={idx.value}
                change={idx.change}
                isPositive={idx.isPositive}
                delay={i * 0.1}
                icon={<BarChart2 size={18} />}
              />
            ))}
          </div>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
          >
            <Activity size={20} className="text-blue-500" />
            Popular Stocks
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {POPULAR_SYMBOLS.map((s) => (
                <div
                  key={s}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 h-44 animate-pulse border border-gray-100 dark:border-gray-700"
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
              className="text-center py-16 text-gray-400"
            >
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No stocks found for &quot;{searchQuery}&quot;</p>
            </motion.div>
          )}
        </div>
      ),
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
  ].filter((w) => w.id !== 'stock-chart' || selectedStock !== undefined)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar — shrinks on scroll */}
      <motion.nav
        ref={navRef}
        style={{ height: navHeight, boxShadow: navShadow }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-500" size={22} />
          <span className="font-bold text-lg text-gray-900 dark:text-white">StockFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDragMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDragMode
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isDragMode ? (
              <>
                <Check size={14} />
                Done
              </>
            ) : (
              <>
                <LayoutDashboard size={14} />
                Customize
              </>
            )}
          </motion.button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            <Bell size={18} />
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 py-8 pl-12"
      >
        <DraggableGrid widgets={widgets} isDragMode={isDragMode} />
      </motion.div>
    </div>
  )
}
