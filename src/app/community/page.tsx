'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { IdeaCard, CommunityIdea } from '@/components/community/idea-card'
import { CommunityFilters } from '@/components/community/community-filters'

function generateChartData(direction: 'long' | 'short' | 'neutral', points = 30): { close: number }[] {
  const data: { close: number }[] = []
  let price = 100 + Math.random() * 50
  for (let i = 0; i < points; i++) {
    const trend = direction === 'long' ? 0.3 : direction === 'short' ? -0.3 : 0
    price += trend + (Math.random() - 0.5) * 4
    data.push({ close: Math.max(price, 10) })
  }
  return data
}

const MOCK_IDEAS: CommunityIdea[] = [
  {
    id: '1', symbol: 'AAPL', exchange: 'NASDAQ', title: 'Apple breaking out of wedge pattern — target $210',
    description: 'AAPL has been consolidating in a descending wedge for 3 weeks. Volume picking up on the breakout attempt. Watch for confirmation above $195.',
    author: { name: 'TradingMaster', avatar: '' }, timeframe: '1D', direction: 'long',
    likes: 1243, comments: 87, views: 15420, tags: ['Bullish', 'Technical Analysis', 'Breakout'],
    createdAt: '2h ago', chartData: generateChartData('long'),
  },
  {
    id: '2', symbol: 'TSLA', exchange: 'NASDAQ', title: 'Tesla head & shoulders forming — bearish setup',
    description: 'Clear H&S pattern on the 4H chart. Neckline at $240 needs to hold or we see $210 quickly.',
    author: { name: 'ChartWhiz', avatar: '' }, timeframe: '4H', direction: 'short',
    likes: 892, comments: 156, views: 22100, tags: ['Bearish', 'Chart Pattern'],
    createdAt: '4h ago', chartData: generateChartData('short'),
  },
  {
    id: '3', symbol: 'BTCUSD', exchange: 'CRYPTO', title: 'Bitcoin monthly close above $95K — next stop $120K',
    description: 'Massive monthly candle with strong volume. Fibonacci extension targets point to $120K within Q2.',
    author: { name: 'CryptoSage', avatar: '' }, timeframe: '1M', direction: 'long',
    likes: 3421, comments: 312, views: 89200, tags: ['Bullish', 'Fibonacci', 'Crypto'],
    createdAt: '6h ago', chartData: generateChartData('long'),
  },
  {
    id: '4', symbol: 'GOOGL', exchange: 'NASDAQ', title: 'Alphabet double bottom reversal — strong buy zone',
    description: 'GOOGL tested $165 support twice with bullish divergence on RSI. Entry here with stop below $162.',
    author: { name: 'ValueHunter', avatar: '' }, timeframe: '1D', direction: 'long',
    likes: 567, comments: 43, views: 8900, tags: ['Bullish', 'RSI Divergence'],
    createdAt: '8h ago', chartData: generateChartData('long'),
  },
  {
    id: '5', symbol: 'NVDA', exchange: 'NASDAQ', title: 'NVDA overextended — expecting pullback to $850',
    description: 'RSI above 80 on weekly. Price far above 20-day MA. Expecting a healthy correction before next leg up.',
    author: { name: 'TechTrader', avatar: '' }, timeframe: '1W', direction: 'short',
    likes: 1100, comments: 201, views: 34500, tags: ['Bearish', 'Overbought', 'AI Stocks'],
    createdAt: '12h ago', chartData: generateChartData('short'),
  },
  {
    id: '6', symbol: 'META', exchange: 'NASDAQ', title: 'Meta consolidating — symmetrical triangle forming',
    description: 'Neutral for now, waiting for breakout direction. Volume declining as expected. Big move coming soon.',
    author: { name: 'PatternPro', avatar: '' }, timeframe: '1D', direction: 'neutral',
    likes: 445, comments: 67, views: 11200, tags: ['Neutral', 'Triangle Pattern'],
    createdAt: '1d ago', chartData: generateChartData('neutral'),
  },
  {
    id: '7', symbol: 'AMZN', exchange: 'NASDAQ', title: 'Amazon cup & handle confirmed — bullish continuation',
    description: 'Beautiful cup and handle on the daily. Handle pullback is shallow, exactly what we want. Target is $215.',
    author: { name: 'SwingKing', avatar: '' }, timeframe: '1D', direction: 'long',
    likes: 789, comments: 54, views: 14300, tags: ['Bullish', 'Cup & Handle'],
    createdAt: '1d ago', chartData: generateChartData('long'),
  },
  {
    id: '8', symbol: 'MSFT', exchange: 'NASDAQ', title: 'Microsoft range-bound between $410-$430 — play the range',
    description: 'MSFT stuck in a clear range. Buy at support, sell at resistance. Simple and effective.',
    author: { name: 'RangeTrader', avatar: '' }, timeframe: '4H', direction: 'neutral',
    likes: 334, comments: 29, views: 7600, tags: ['Neutral', 'Range Trading'],
    createdAt: '1d ago', chartData: generateChartData('neutral'),
  },
  {
    id: '9', symbol: 'AAPL', exchange: 'NASDAQ', title: 'Apple earnings play — IV crush opportunity',
    description: 'With earnings approaching, implied volatility is sky high. Selling iron condors for premium collection.',
    author: { name: 'OptionsGuru', avatar: '' }, timeframe: '1D', direction: 'neutral',
    likes: 621, comments: 88, views: 19800, tags: ['Options', 'Earnings', 'IV Crush'],
    createdAt: '2d ago', chartData: generateChartData('neutral'),
  },
  {
    id: '10', symbol: 'TSLA', exchange: 'NASDAQ', title: 'Tesla long-term bull case — $300 by year end',
    description: 'FSD progress, Cybertruck ramp, energy business growth. Fundamentals support a much higher price.',
    author: { name: 'FundyTrader', avatar: '' }, timeframe: '1M', direction: 'long',
    likes: 2100, comments: 445, views: 56700, tags: ['Bullish', 'Fundamental Analysis', 'EV'],
    createdAt: '2d ago', chartData: generateChartData('long'),
  },
  {
    id: '11', symbol: 'NVDA', exchange: 'NASDAQ', title: 'NVDA ascending channel — ride the trend',
    description: 'Perfectly riding the ascending channel since October. Buy the dips to the lower trendline.',
    author: { name: 'TrendFollower', avatar: '' }, timeframe: '1W', direction: 'long',
    likes: 1567, comments: 123, views: 41200, tags: ['Bullish', 'Trend Following', 'AI'],
    createdAt: '3d ago', chartData: generateChartData('long'),
  },
  {
    id: '12', symbol: 'GOOGL', exchange: 'NASDAQ', title: 'Alphabet gap fill incoming — watch $158 level',
    description: 'Unfilled gap from last earnings. Gaps tend to fill. Targeting $158 for long entry.',
    author: { name: 'GapTrader', avatar: '' }, timeframe: '1D', direction: 'short',
    likes: 298, comments: 41, views: 6400, tags: ['Bearish', 'Gap Fill'],
    createdAt: '3d ago', chartData: generateChartData('short'),
  },
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'popular' | 'editors'>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIdeas = searchQuery
    ? MOCK_IDEAS.filter(
        (idea) =>
          idea.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : MOCK_IDEAS

  const displayedIdeas = activeTab === 'editors'
    ? filteredIdeas.filter((_, i) => i % 3 === 0)
    : filteredIdeas

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={24} />
              <span className="font-bold text-xl text-gray-900 dark:text-white">StockFlow</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/community" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Community
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3"
          >
            Community Ideas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto mb-8"
          >
            Discover trading ideas from our community of analysts and traders
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-md mx-auto relative mb-8"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search ideas by symbol, title, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CommunityFilters
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </motion.div>
        </div>
      </div>

      {/* Ideas grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'grid grid-cols-1 gap-4'
        }>
          {displayedIdeas.map((idea, i) => (
            <IdeaCard key={idea.id} idea={idea} index={i} />
          ))}
        </div>

        {displayedIdeas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-gray-400"
          >
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p>No ideas found for &quot;{searchQuery}&quot;</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
