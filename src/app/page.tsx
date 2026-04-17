'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Filter, Flame, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import TickerTape from '@/components/TickerTape'
import IdeaCard from '@/components/IdeaCard'
import { StockDetailModal } from '@/components/stock/stock-detail-modal'

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
const MARKET_STRIPS = [
  { name: 'S&P 500', symbol: 'SPY', value: '6,632.20', unit: 'USD', change: '-0.61%', positive: false },
  { name: 'Nasdaq 100', symbol: 'QQQ', value: '24,380.73', unit: 'USD', change: '-0.62%', positive: false },
  { name: 'Dow 30', symbol: 'DIA', value: '42,558.48', unit: 'USD', change: '-0.26%', positive: false },
  { name: 'US 2000', symbol: 'IWM', value: '2,474.08', unit: 'USD', change: '-0.74%', positive: false },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('Popular')
  const [activeFilter, setActiveFilter] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

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

  if (!mounted) {
    return (
      <div className="app-shell market-shell min-h-screen">
        <Navbar />
        <div className="pt-14">
          <div className="h-11 border-b border-[var(--border)] bg-[var(--surface)]" />
        </div>
        <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
          <div className="rounded-[2.5rem] border border-white/8 bg-[var(--surface-elevated)]/70 min-h-[420px] mb-8" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="rounded-[2rem] border border-white/8 bg-[var(--surface-elevated)]/60 min-h-[360px]" />
            <div className="rounded-[2rem] border border-white/8 bg-[var(--surface-elevated)]/60 min-h-[360px]" />
          </div>
          <div className="rounded-[2rem] border border-white/8 bg-[var(--surface-elevated)]/60 min-h-[220px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell market-shell min-h-screen">
      <Navbar />

      {/* Ticker tape below nav */}
      <div className="pt-14">
        <TickerTape />
      </div>

      {/* Main content */}
      <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
        <div className="relative overflow-hidden rounded-[2.5rem] px-2 md:px-0 mb-8">
          <div className="cinematic-hero px-6 py-8 md:px-10 md:py-10">
            <div className="hero-signal-field">
              {[
                { left: '8%', height: '28%', color: '#67e8f9', delay: '0s' },
                { left: '12%', height: '18%', color: '#c084fc', delay: '0.8s' },
                { left: '18%', height: '34%', color: '#f472b6', delay: '0.4s' },
                { left: '24%', height: '22%', color: '#67e8f9', delay: '1.1s' },
                { left: '33%', height: '30%', color: '#f472b6', delay: '0.5s' },
                { left: '41%', height: '24%', color: '#c084fc', delay: '1.4s' },
                { left: '49%', height: '36%', color: '#f472b6', delay: '0.2s' },
                { left: '58%', height: '21%', color: '#67e8f9', delay: '1.7s' },
                { left: '66%', height: '26%', color: '#f472b6', delay: '0.9s' },
                { left: '74%', height: '20%', color: '#a78bfa', delay: '1.2s' },
              ].map((beam, index) => (
                <span
                  key={index}
                  style={{
                    left: beam.left,
                    height: beam.height,
                    color: beam.color,
                    animationDelay: beam.delay,
                  }}
                />
              ))}
            </div>

            <div className="hero-horizon" />
            <div className="hero-city-glow" />
            <div className="hero-floor-glow" />
            <div className="hero-portal" />
            <div className="hero-silhouette" />
            <div className="hero-silhouette-rails" />

            <div className="cinematic-hero-copy relative z-10 text-center pt-10 md:pt-16">
              <p className="section-kicker text-xs mb-4 text-white/70">Look first / Then move</p>
              <div className="hero-title-wrap">
                <h1 className="hero-copy-glow text-[2.75rem] md:text-[5rem] font-bold leading-[0.94] tracking-[-0.055em] text-white max-w-5xl mx-auto">
                  Trade with depth, not noise.
                </h1>
              </div>
              <p className="text-base md:text-[1.42rem] leading-[1.45] text-white/80 mt-6 max-w-[48rem] mx-auto">
                Build conviction with live market context, cinematic clarity, and a workspace that feels as sharp as the decisions you make inside it.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-[1.6rem] text-lg font-semibold bg-white text-slate-950 shadow-[0_24px_70px_rgba(255,255,255,0.18)] hover:-translate-y-0.5"
                >
                  Start free
                </Link>
                <p className="text-sm text-white/72">$0 to explore, no card required</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          <div
            className="hero-variant-card layered-hero p-6 md:p-8"
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const x = (event.clientX - rect.left) / rect.width - 0.5
              const y = (event.clientY - rect.top) / rect.height - 0.5
              setParallax({ x, y })
            }}
            onMouseLeave={() => setParallax({ x: 0, y: 0 })}
          >
            <div className="layered-grid" />
            <div className="layered-glow" />

            <div
              className="parallax-layer top-[12%] left-[7%] w-[16rem] p-4"
              style={{ transform: `translate(${parallax.x * -18}px, ${parallax.y * -10}px)` }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Flow</p>
              <p className="text-2xl font-bold text-white mt-2">+$2.18M</p>
              <p className="text-sm text-emerald-300 mt-1">High-conviction moves accelerating</p>
            </div>

            <div
              className="parallax-layer top-[22%] right-[9%] w-[14rem] p-4"
              style={{ transform: `translate(${parallax.x * 22}px, ${parallax.y * -14}px)` }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Signal stack</p>
              <div className="mt-3 flex items-end gap-2">
                <div className="h-12 w-2 rounded-full bg-cyan-300/80" />
                <div className="h-20 w-2 rounded-full bg-fuchsia-400/80" />
                <div className="h-10 w-2 rounded-full bg-emerald-300/80" />
                <div className="h-16 w-2 rounded-full bg-sky-400/80" />
                <div className="h-8 w-2 rounded-full bg-violet-300/80" />
              </div>
            </div>

            <div
              className="parallax-layer bottom-[10%] left-[13%] right-[12%] p-5"
              style={{ transform: `translate(${parallax.x * -12}px, ${parallax.y * 16}px)` }}
            >
              <p className="section-kicker text-xs mb-3 text-white/60">Layered Parallax</p>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight text-white">
                Depth from floating data layers.
              </h3>
              <p className="text-sm md:text-base text-white/72 mt-3 max-w-xl">
                This version uses stacked glass panels, motion response, and spatial spacing to create 3D feel without a heavy 3D engine.
              </p>
            </div>
          </div>

          <div className="hero-variant-card spline-ready-hero p-6 md:p-8">
            <div className="relative z-10 flex flex-col h-full">
              <p className="section-kicker text-xs mb-3 text-white/60">Spline Ready</p>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight text-white max-w-xl">
                Swap in a real 3D scene when you have the asset.
              </h3>
              <p className="text-sm md:text-base text-white/74 mt-3 max-w-xl">
                This section is built to accept a future Spline embed, while keeping a premium fallback scene in place today.
              </p>

              <div className="spline-stage mt-8 flex-1 min-h-[24rem]">
                <div className="spline-orb" />
                <div className="absolute inset-x-10 bottom-8 rounded-[1.4rem] border border-white/10 bg-slate-950/62 px-5 py-4 backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Scene slot</p>
                  <p className="text-lg font-semibold text-white mt-2">Drop your Spline URL here later</p>
                  <p className="text-sm text-white/66 mt-1">
                    Replace the fallback orb with a live scene once you pick the final brand direction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {MARKET_STRIPS.map((item) => (
            <button key={item.name} onClick={() => setSelectedSymbol(item.symbol)} className="market-soft-card px-5 py-5 text-left w-full" style={{ cursor: 'pointer', background: 'none' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-[var(--foreground)]">{item.name}</span>
                <ChevronRight size={18} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-[-0.04em] text-[var(--foreground)]">{item.value}</span>
                <span className="ticker-mono text-xs mb-1 text-[var(--text-secondary)]">{item.unit}</span>
              </div>
              <div className="mt-2 text-sm font-medium" style={{ color: item.positive ? 'var(--green)' : 'var(--red)' }}>
                {item.change}
              </div>
              <div className="mt-4 h-16 rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(239,68,68,0.14),rgba(239,68,68,0.02))] border border-[rgba(239,68,68,0.08)]" />
            </button>
          ))}
        </div>

        <StockDetailModal symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />

        {/* Feature highlights — TradingView style */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Everything you need</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] tracking-tight">
              Charts built for every trader
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '📈',
                title: 'Advanced Charts',
                desc: 'Candlestick, Heikin Ashi, Renko, and 10+ chart types with 100+ built-in indicators.',
                color: '#2962ff',
              },
              {
                icon: '🔍',
                title: 'Stock Screener',
                desc: 'Filter 10,000+ stocks by technicals, fundamentals, and performance metrics.',
                color: '#26a69a',
              },
              {
                icon: '🗺️',
                title: 'Market Heatmap',
                desc: 'Visualize the entire market at a glance. Spot sector rotation and movers instantly.',
                color: '#f7931a',
              },
              {
                icon: '🔔',
                title: 'Price Alerts',
                desc: 'Set unlimited price alerts and get notified the moment your targets are hit.',
                color: '#ef5350',
              },
              {
                icon: '💼',
                title: 'Portfolio Tracker',
                desc: 'Track your holdings, P&L, and performance with real-time data.',
                color: '#9c27b0',
              },
              {
                icon: '💬',
                title: 'Community Ideas',
                desc: 'Learn from thousands of traders sharing analysis, setups, and market outlooks.',
                color: '#00bcd4',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="market-soft-card p-6 rounded-[1.4rem] flex flex-col gap-3 hover:-translate-y-0.5 transition-transform"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: f.color + '22', border: `1px solid ${f.color}44` }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] text-[15px]">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="market-soft-card px-5 py-6 md:px-8 md:py-8 mb-8">
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="section-kicker text-xs mb-3">Live market intelligence</p>
              <h2 className="text-2xl md:text-4xl font-bold leading-[1.02] tracking-tight text-[var(--foreground)]">
                Community conviction with a chart-first workflow.
              </h2>
              <p className="text-sm md:text-base text-[var(--text-secondary)] mt-4 max-w-xl">
                Scan fresh setups, follow trader sentiment, and move from signal to dashboard without leaving the same surface.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[360px] lg:min-w-[420px]">
              {[
                { label: 'Hot ideas', value: '148', tone: 'var(--accent)' },
                { label: 'Win rate', value: '68.4%', tone: 'var(--green)' },
                { label: 'New today', value: '24', tone: 'var(--foreground)' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-4">
                  <div className="ticker-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">{stat.label}</div>
                  <div className="text-2xl font-bold mt-2" style={{ color: stat.tone }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="section-kicker text-xs mb-2">Trade ideas stream</p>
            <h2 className="text-xl md:text-2xl font-semibold mb-1 text-[var(--foreground)]">
              Community ideas
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Top trading ideas and analysis from our community of traders
            </p>
          </div>

          {/* Tabs */}
          <div className="market-pill flex items-center rounded-full overflow-hidden flex-shrink-0 p-1.5">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setVisibleCount(PAGE_SIZE) }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeTab === tab
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab === 'Popular' && <Flame size={13} />}
                {tab === "Editors' picks" && <Star size={13} />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="market-soft-card flex items-center gap-2 mb-6 flex-wrap rounded-[1.6rem] px-4 py-3">
          <Filter size={14} className="text-[var(--text-secondary)]" />
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => { setActiveFilter(filter); setVisibleCount(PAGE_SIZE) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === filter
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-white/70 text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--foreground)]'
                }`}
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
              className="market-soft-card px-6 py-2.5 rounded-full text-sm font-medium text-[var(--foreground)] hover:-translate-y-0.5"
            >
              Load more ideas ({filteredIdeas.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* CTA block */}
      <div className="max-w-[1240px] mx-auto px-4">
        <div
          className="mt-12 mb-4 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e222d 0%, #131722 100%)', border: '1px solid #2a2e39' }}
        >
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, #2962ff55, transparent 70%)' }} />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Start trading smarter today
            </h2>
            <p className="text-sm md:text-base text-white/70 mb-8 max-w-lg mx-auto">
              Join millions of traders on the platform built for serious market analysis. Free forever, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold bg-[#2962ff] text-white hover:-translate-y-0.5 transition-transform shadow-[0_8px_30px_rgba(41,98,255,0.4)]"
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium border border-white/20 text-white/80 hover:text-white hover:-translate-y-0.5 transition-transform"
              >
                Open live chart
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="mt-12 py-6 px-4 border-t border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--accent)]"
            >
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-sm text-[var(--foreground)]">
              StockFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            {['About', 'Features', 'Pricing', 'Community', 'Blog', 'Privacy', 'Terms'].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-xs transition-colors text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              >
                {link}
              </Link>
            ))}
          </div>
          <p className="ticker-mono text-xs text-[var(--text-secondary)]">
            © 2026 StockFlow
          </p>
        </div>
      </footer>
    </div>
  )
}
