'use client'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, MessageCircle, Eye, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function generateChartData(direction: 'long' | 'short' | 'neutral', points = 60): { date: string; close: number }[] {
  const data: { date: string; close: number }[] = []
  let price = 100 + Math.random() * 50
  const now = new Date()
  for (let i = points; i >= 0; i--) {
    const trend = direction === 'long' ? 0.3 : direction === 'short' ? -0.3 : 0
    price += trend + (Math.random() - 0.5) * 4
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    data.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), close: Math.max(price, 10) })
  }
  return data
}

const IDEAS: Record<string, {
  id: string; symbol: string; exchange: string; title: string; description: string
  author: { name: string }; timeframe: string; direction: 'long' | 'short' | 'neutral'
  likes: number; comments: number; views: number; tags: string[]; createdAt: string
}> = {
  '1': { id: '1', symbol: 'AAPL', exchange: 'NASDAQ', title: 'Apple breaking out of wedge pattern — target $210', description: 'AAPL has been consolidating in a descending wedge for 3 weeks. Volume picking up on the breakout attempt. Watch for confirmation above $195.\n\nThe RSI is showing bullish divergence on the 4H timeframe, and MACD is about to cross above signal. I expect a move to $210 within 2-3 weeks with a stop below $188.', author: { name: 'TradingMaster' }, timeframe: '1D', direction: 'long', likes: 1243, comments: 87, views: 15420, tags: ['Bullish', 'Technical Analysis', 'Breakout'], createdAt: '2h ago' },
  '2': { id: '2', symbol: 'TSLA', exchange: 'NASDAQ', title: 'Tesla head & shoulders forming — bearish setup', description: 'Clear H&S pattern on the 4H chart. Neckline at $240 needs to hold or we see $210 quickly.\n\nVolume on the right shoulder is declining which confirms the pattern. Targeting $210 on a neckline break with stop above the right shoulder high at $265.', author: { name: 'ChartWhiz' }, timeframe: '4H', direction: 'short', likes: 892, comments: 156, views: 22100, tags: ['Bearish', 'Chart Pattern'], createdAt: '4h ago' },
  '3': { id: '3', symbol: 'BTCUSD', exchange: 'CRYPTO', title: 'Bitcoin monthly close above $95K — next stop $120K', description: 'Massive monthly candle with strong volume. Fibonacci extension targets point to $120K within Q2.\n\nOn-chain data shows long-term holders accumulating. Exchange outflows at multi-year highs. This is not retail — institutional money is moving in.', author: { name: 'CryptoSage' }, timeframe: '1M', direction: 'long', likes: 3421, comments: 312, views: 89200, tags: ['Bullish', 'Fibonacci', 'Crypto'], createdAt: '6h ago' },
  '4': { id: '4', symbol: 'GOOGL', exchange: 'NASDAQ', title: 'Alphabet double bottom reversal — strong buy zone', description: 'GOOGL tested $165 support twice with bullish divergence on RSI. Entry here with stop below $162.', author: { name: 'ValueHunter' }, timeframe: '1D', direction: 'long', likes: 567, comments: 43, views: 8900, tags: ['Bullish', 'RSI Divergence'], createdAt: '8h ago' },
  '5': { id: '5', symbol: 'NVDA', exchange: 'NASDAQ', title: 'NVDA overextended — expecting pullback to $850', description: 'RSI above 80 on weekly. Price far above 20-day MA. Expecting a healthy correction before next leg up.', author: { name: 'TechTrader' }, timeframe: '1W', direction: 'short', likes: 1100, comments: 201, views: 34500, tags: ['Bearish', 'Overbought', 'AI Stocks'], createdAt: '12h ago' },
  '6': { id: '6', symbol: 'META', exchange: 'NASDAQ', title: 'Meta consolidating — symmetrical triangle forming', description: 'Neutral for now, waiting for breakout direction. Volume declining as expected. Big move coming soon.', author: { name: 'PatternPro' }, timeframe: '1D', direction: 'neutral', likes: 445, comments: 67, views: 11200, tags: ['Neutral', 'Triangle Pattern'], createdAt: '1d ago' },
  '7': { id: '7', symbol: 'AMZN', exchange: 'NASDAQ', title: 'Amazon cup & handle confirmed — bullish continuation', description: 'Beautiful cup and handle on the daily. Handle pullback is shallow, exactly what we want. Target is $215.', author: { name: 'SwingKing' }, timeframe: '1D', direction: 'long', likes: 789, comments: 54, views: 14300, tags: ['Bullish', 'Cup & Handle'], createdAt: '1d ago' },
  '8': { id: '8', symbol: 'MSFT', exchange: 'NASDAQ', title: 'Microsoft range-bound between $410-$430 — play the range', description: 'MSFT stuck in a clear range. Buy at support, sell at resistance. Simple and effective.', author: { name: 'RangeTrader' }, timeframe: '4H', direction: 'neutral', likes: 334, comments: 29, views: 7600, tags: ['Neutral', 'Range Trading'], createdAt: '1d ago' },
  '9': { id: '9', symbol: 'AAPL', exchange: 'NASDAQ', title: 'Apple earnings play — IV crush opportunity', description: 'With earnings approaching, implied volatility is sky high. Selling iron condors for premium collection.', author: { name: 'OptionsGuru' }, timeframe: '1D', direction: 'neutral', likes: 621, comments: 88, views: 19800, tags: ['Options', 'Earnings', 'IV Crush'], createdAt: '2d ago' },
  '10': { id: '10', symbol: 'TSLA', exchange: 'NASDAQ', title: 'Tesla long-term bull case — $300 by year end', description: 'FSD progress, Cybertruck ramp, energy business growth. Fundamentals support a much higher price.', author: { name: 'FundyTrader' }, timeframe: '1M', direction: 'long', likes: 2100, comments: 445, views: 56700, tags: ['Bullish', 'Fundamental Analysis', 'EV'], createdAt: '2d ago' },
  '11': { id: '11', symbol: 'NVDA', exchange: 'NASDAQ', title: 'NVDA ascending channel — ride the trend', description: 'Perfectly riding the ascending channel since October. Buy the dips to the lower trendline.', author: { name: 'TrendFollower' }, timeframe: '1W', direction: 'long', likes: 1567, comments: 123, views: 41200, tags: ['Bullish', 'Trend Following', 'AI'], createdAt: '3d ago' },
  '12': { id: '12', symbol: 'GOOGL', exchange: 'NASDAQ', title: 'Alphabet gap fill incoming — watch $158 level', description: 'Unfilled gap from last earnings. Gaps tend to fill. Targeting $158 for long entry.', author: { name: 'GapTrader' }, timeframe: '1D', direction: 'short', likes: 298, comments: 41, views: 6400, tags: ['Bearish', 'Gap Fill'], createdAt: '3d ago' },
}

const directionConfig = {
  long: { color: '#26a69a', label: 'Long', Icon: TrendingUp },
  short: { color: '#ef5350', label: 'Short', Icon: TrendingDown },
  neutral: { color: '#787B86', label: 'Neutral', Icon: Minus },
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idea = IDEAS[id]

  if (!idea) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#131722' }}>
        <p className="text-lg" style={{ color: '#D1D4DC' }}>Idea not found</p>
        <Link href="/community" className="text-sm" style={{ color: '#2962FF' }}>Back to Community</Link>
      </div>
    )
  }

  const dir = directionConfig[idea.direction]
  const chartData = generateChartData(idea.direction)

  return (
    <div className="min-h-screen" style={{ background: '#131722', color: '#D1D4DC' }}>
      {/* Top bar */}
      <div className="flex items-center h-12 px-4 gap-3" style={{ background: '#1E222D', borderBottom: '1px solid #2A2E39' }}>
        <Link href="/community" className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity" style={{ color: '#787B86' }}>
          <ArrowLeft size={16} />
          Community
        </Link>
        <span style={{ color: '#2A2E39' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: '#2962FF' }}>{idea.symbol}</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#2A2E39', color: '#D1D4DC' }}>
              {idea.symbol}
            </span>
            <span className="text-xs" style={{ color: '#787B86' }}>{idea.exchange}</span>
            <span className="text-xs" style={{ color: '#787B86' }}>·</span>
            <span className="text-xs" style={{ color: '#787B86' }}>{idea.timeframe}</span>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ml-1"
              style={{ background: `${dir.color}20`, color: dir.color, border: `1px solid ${dir.color}40` }}
            >
              <dir.Icon size={11} />
              {dir.label}
            </span>
          </div>

          <h1 className="text-xl font-bold mb-3" style={{ color: '#D1D4DC' }}>{idea.title}</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#2962FF', color: '#fff' }}
              >
                {idea.author.name[0]}
              </div>
              <span className="text-sm font-medium" style={{ color: '#D1D4DC' }}>{idea.author.name}</span>
            </div>
            <span className="text-xs" style={{ color: '#787B86' }}>{idea.createdAt}</span>
          </div>
        </div>

        {/* Chart */}
        <div
          className="rounded mb-6"
          style={{ background: '#1E222D', border: '1px solid #2A2E39', padding: '16px' }}
        >
          <p className="text-xs mb-3 font-medium" style={{ color: '#787B86' }}>
            {idea.symbol} · {idea.timeframe} Chart
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ideaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dir.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={dir.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" opacity={0.8} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#787B86' }} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tick={{ fontSize: 11, fill: '#787B86' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `$${v.toFixed(0)}`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E222D', border: '1px solid #2A2E39', borderRadius: 4, color: '#D1D4DC', fontSize: 12 }}
                formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Price']}
              />
              <Area type="monotone" dataKey="close" stroke={dir.color} strokeWidth={2} fill="url(#ideaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 rounded p-4" style={{ background: '#1E222D', border: '1px solid #2A2E39' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#D1D4DC' }}>Analysis</h2>
            {idea.description.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm mb-3 last:mb-0 leading-relaxed" style={{ color: '#787B86' }}>
                {para}
              </p>
            ))}

            <div className="flex flex-wrap gap-1.5 mt-4">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: '#2A2E39', color: '#787B86' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded p-4" style={{ background: '#1E222D', border: '1px solid #2A2E39' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#D1D4DC' }}>Stats</h2>
            <div className="space-y-3">
              {[
                { label: 'Likes', value: formatNumber(idea.likes), icon: <Heart size={14} /> },
                { label: 'Comments', value: String(idea.comments), icon: <MessageCircle size={14} /> },
                { label: 'Views', value: formatNumber(idea.views), icon: <Eye size={14} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm" style={{ color: '#787B86' }}>
                    {icon} {label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#D1D4DC' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-colors"
                style={{ background: '#2962FF', color: '#fff' }}
              >
                <Heart size={12} /> Like
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{ background: '#2A2E39', color: '#D1D4DC' }}
              >
                <Share2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Back link */}
        <Link href="/community" className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#2962FF' }}>
          ← Back to all ideas
        </Link>
      </div>
    </div>
  )
}
