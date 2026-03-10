'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Filter, Flame, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import TickerTape from '@/components/TickerTape'
import IdeaCard from '@/components/IdeaCard'

const IDEAS = [
  {
    symbol: 'AAPL',
    title: 'Apple breakout above key resistance — targeting $210 next',
    author: 'TechTrader',
    authorInitials: 'TT',
    avatarColor: '#2962FF',
    direction: 'Long' as const,
    timeframe: '1D',
    likes: 342,
    comments: 48,
    views: '12.4K',
    chartColor: '#26A69A',
  },
  {
    symbol: 'TSLA',
    title: 'Tesla forms double top — bearish reversal incoming to $220 support',
    author: 'ElonWatcher',
    authorInitials: 'EW',
    avatarColor: '#EF5350',
    direction: 'Short' as const,
    timeframe: '4H',
    likes: 218,
    comments: 63,
    views: '8.9K',
    chartColor: '#EF5350',
  },
  {
    symbol: 'BTC',
    title: 'Bitcoin weekly close above $65K — bullish continuation to ATH',
    author: 'CryptoKing',
    authorInitials: 'CK',
    avatarColor: '#F7931A',
    direction: 'Long' as const,
    timeframe: '1W',
    likes: 891,
    comments: 124,
    views: '45.2K',
    chartColor: '#26A69A',
  },
  {
    symbol: 'NVDA',
    title: 'NVDA consolidating in pennant — explosive move to $950 expected',
    author: 'ChipAnalyst',
    authorInitials: 'CA',
    avatarColor: '#76B900',
    direction: 'Long' as const,
    timeframe: '1D',
    likes: 567,
    comments: 89,
    views: '21.7K',
    chartColor: '#26A69A',
  },
  {
    symbol: 'SPY',
    title: 'S&P 500 overbought signals — correction to 505 before next leg up',
    author: 'MarketOwl',
    authorInitials: 'MO',
    avatarColor: '#9C27B0',
    direction: 'Short' as const,
    timeframe: '1W',
    likes: 445,
    comments: 97,
    views: '33.1K',
    chartColor: '#EF5350',
  },
  {
    symbol: 'ETH',
    title: 'Ethereum golden cross on daily — $4K target by end of month',
    author: 'DeFiDave',
    authorInitials: 'DD',
    avatarColor: '#627EEA',
    direction: 'Long' as const,
    timeframe: '1D',
    likes: 312,
    comments: 55,
    views: '15.8K',
    chartColor: '#26A69A',
  },
  {
    symbol: 'MSFT',
    title: 'Microsoft cloud revenue beat incoming — accumulating before earnings',
    author: 'CloudBull',
    authorInitials: 'CB',
    avatarColor: '#00BCF2',
    direction: 'Long' as const,
    timeframe: '1D',
    likes: 289,
    comments: 41,
    views: '9.3K',
    chartColor: '#26A69A',
  },
  {
    symbol: 'META',
    title: 'Meta Reality Labs drag persists — fading the rally at $500',
    author: 'SocialSkeptic',
    authorInitials: 'SS',
    avatarColor: '#1877F2',
    direction: 'Short' as const,
    timeframe: '4H',
    likes: 178,
    comments: 36,
    views: '7.1K',
    chartColor: '#EF5350',
  },
  {
    symbol: 'AMZN',
    title: 'Amazon Prime Day catalyst — swing long into $200 resistance',
    author: 'RetailRaider',
    authorInitials: 'RR',
    avatarColor: '#FF9900',
    direction: 'Long' as const,
    timeframe: '4H',
    likes: 234,
    comments: 29,
    views: '11.2K',
    chartColor: '#26A69A',
  },
]

const TABS = ['Popular', "Editors' picks", 'Following']

const FILTER_OPTIONS = ['All', 'Long', 'Short', 'Stocks', 'Crypto', 'Forex']

const PAGE_SIZE = 6

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('Popular')
  const [activeFilter, setActiveFilter] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredIdeas =
    activeFilter === 'All'
      ? IDEAS
      : activeFilter === 'Long'
        ? IDEAS.filter((i) => i.direction === 'Long')
        : activeFilter === 'Short'
          ? IDEAS.filter((i) => i.direction === 'Short')
          : activeFilter === 'Crypto'
            ? IDEAS.filter((i) => ['BTC', 'ETH'].includes(i.symbol))
            : IDEAS

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#131722' }}>
      <Navbar />

      {/* Ticker tape below nav */}
      <div className="pt-12">
        <TickerTape />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: '#D1D4DC' }}>
              Community ideas
            </h1>
            <p className="text-sm" style={{ color: '#787B86' }}>
              Top trading ideas and analysis from our community of traders
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex items-center rounded overflow-hidden flex-shrink-0"
            style={{ backgroundColor: '#1E222D', border: '1px solid #2A2E39' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setVisibleCount(PAGE_SIZE) }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === tab ? '#2A2E39' : 'transparent',
                  color: activeTab === tab ? '#D1D4DC' : '#787B86',
                }}
              >
                {tab === 'Popular' && <Flame size={13} />}
                {tab === "Editors' picks" && <Star size={13} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter size={14} style={{ color: '#787B86' }} />
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setVisibleCount(PAGE_SIZE) }}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: activeFilter === filter ? '#2962FF' : '#1E222D',
                  color: activeFilter === filter ? '#fff' : '#787B86',
                  border: `1px solid ${activeFilter === filter ? '#2962FF' : '#2A2E39'}`,
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.slice(0, visibleCount).map((idea, i) => (
            <IdeaCard key={`${idea.symbol}-${i}`} {...idea} />
          ))}
        </div>

        {/* Load more */}
        {visibleCount < filteredIdeas.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="px-6 py-2 rounded text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: '#1E222D',
                color: '#D1D4DC',
                border: '1px solid #2A2E39',
              }}
            >
              Load more ideas ({filteredIdeas.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="mt-12 py-6 px-4"
        style={{ borderTop: '1px solid #2A2E39' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded"
              style={{ backgroundColor: '#2962FF' }}
            >
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#D1D4DC' }}>
              StockFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            {['About', 'Features', 'Pricing', 'Community', 'Blog', 'Privacy', 'Terms'].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs transition-colors hover:text-white"
                style={{ color: '#787B86' }}
              >
                {link}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#787B86' }}>
            © 2026 StockFlow
          </p>
        </div>
      </footer>
    </div>
  )
}
