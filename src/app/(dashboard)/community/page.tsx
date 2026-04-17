'use client'

import { useState, useEffect } from 'react'
import { Search, ThumbsUp, MessageCircle } from 'lucide-react'

type Idea = {
  id: string
  symbol: string
  exchange: string
  title: string
  description: string
  author: { name: string; avatar: string }
  timeframe: '1D' | '4H' | '1W' | '1M'
  direction: 'long' | 'short' | 'neutral'
  likes: number
  comments: number
  views: number
  tags: string[]
  createdAt: string
  chartData: { close: number }[]
}

function Sparkline({ data, positive }: { data: { close: number }[]; positive: boolean }) {
  if (!data.length) {
    return (
      <svg width={60} height={32}>
        <line x1={0} y1={16} x2={60} y2={16} stroke="#2a2e39" strokeWidth={1} />
      </svg>
    )
  }
  const min = Math.min(...data.map((d) => d.close))
  const max = Math.max(...data.map((d) => d.close))
  const range = max - min || 1
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * 60},${32 - ((d.close - min) / range) * 28}`)
    .join(' ')
  return (
    <svg width={60} height={32} viewBox="0 0 60 32">
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? '#26a69a' : '#ef5350'}
        strokeWidth={1.5}
      />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 animate-pulse"
      style={{ background: '#1e222d', border: '1px solid #2a2e39' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-16 h-5 rounded" style={{ background: '#2a2e39' }} />
        <div className="w-12 h-5 rounded" style={{ background: '#2a2e39' }} />
      </div>
      <div className="w-full h-4 rounded" style={{ background: '#2a2e39' }} />
      <div className="w-3/4 h-4 rounded" style={{ background: '#2a2e39' }} />
      <div className="w-full h-8 rounded" style={{ background: '#2a2e39' }} />
      <div className="flex items-center gap-2 mt-auto">
        <div className="w-6 h-6 rounded-full" style={{ background: '#2a2e39' }} />
        <div className="w-20 h-3 rounded" style={{ background: '#2a2e39' }} />
      </div>
    </div>
  )
}

const DIRECTION_COLORS = {
  long: { bg: 'rgba(38,166,154,0.15)', text: '#26a69a', label: 'LONG' },
  short: { bg: 'rgba(239,83,80,0.15)', text: '#ef5350', label: 'SHORT' },
  neutral: { bg: 'rgba(120,123,134,0.15)', text: '#787b86', label: 'NEUTRAL' },
}

const TABS = ['All', 'Long', 'Short', 'Trending'] as const
type Tab = (typeof TABS)[number]

export default function CommunityPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/community')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ideas) setIdeas(data.ideas)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = ideas
    .filter((idea) => {
      if (tab === 'Long') return idea.direction === 'long'
      if (tab === 'Short') return idea.direction === 'short'
      return true
    })
    .sort((a, b) => {
      if (tab === 'Trending') return b.views - a.views
      return 0
    })
    .filter((idea) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        idea.symbol.toLowerCase().includes(q) ||
        idea.title.toLowerCase().includes(q) ||
        idea.tags.some((t) => t.toLowerCase().includes(q))
      )
    })

  return (
    <div className="min-h-full p-6" style={{ background: '#131722' }}>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-4 border-b"
        style={{ borderColor: '#2a2e39' }}
      >
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ color: '#d1d4dc' }}>
            Community Ideas
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#787b86' }}>
            Trading analysis and setups from the community
          </p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 h-8 rounded border w-full sm:w-56"
          style={{ background: '#131722', borderColor: '#2a2e39' }}
        >
          <Search size={12} style={{ color: '#787b86', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or tag…"
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: '#d1d4dc' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded text-[12px] font-medium transition-colors"
            style={{
              background: tab === t ? '#2962ff' : 'transparent',
              color: tab === t ? '#fff' : '#787b86',
              border: `1px solid ${tab === t ? '#2962ff' : '#2a2e39'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((idea) => {
              const dir = DIRECTION_COLORS[idea.direction]
              const positive = idea.direction === 'long'
              return (
                <div
                  key={idea.id}
                  className="rounded-xl p-4 flex flex-col gap-3 hover:border-[#363c4e] transition-colors"
                  style={{ background: '#1e222d', border: '1px solid #2a2e39' }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                      style={{ background: '#2a2e39', color: '#d1d4dc' }}
                    >
                      {idea.symbol}
                    </span>
                    <span className="text-[10px]" style={{ color: '#787b86' }}>
                      {idea.exchange}
                    </span>
                    <span
                      className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: dir.bg, color: dir.text }}
                    >
                      {dir.label}
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div>
                    <Sparkline data={idea.chartData} positive={positive} />
                  </div>

                  {/* Title */}
                  <p
                    className="text-[13px] font-semibold leading-snug line-clamp-2"
                    style={{ color: '#d1d4dc' }}
                  >
                    {idea.title}
                  </p>

                  {/* Description */}
                  <p
                    className="text-[11px] leading-relaxed line-clamp-2"
                    style={{ color: '#787b86' }}
                  >
                    {idea.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t" style={{ borderColor: '#2a2e39' }}>
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: '#2962ff', color: '#fff' }}
                    >
                      {idea.author.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] flex-1 truncate" style={{ color: '#787b86' }}>
                      {idea.author.name}
                    </span>

                    {/* Timeframe */}
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                      style={{ background: '#2a2e39', color: '#787b86' }}
                    >
                      {idea.timeframe}
                    </span>

                    {/* Stats */}
                    <span className="flex items-center gap-1 text-[10px] tv-num" style={{ color: '#787b86' }}>
                      <ThumbsUp size={10} /> {idea.likes}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] tv-num" style={{ color: '#787b86' }}>
                      <MessageCircle size={10} /> {idea.comments}
                    </span>
                  </div>

                  <div className="text-[10px]" style={{ color: '#787b86' }}>
                    {idea.createdAt}
                  </div>
                </div>
              )
            })}
      </div>
    </div>
  )
}
