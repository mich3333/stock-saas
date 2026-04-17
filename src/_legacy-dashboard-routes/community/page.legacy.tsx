'use client'

import { useState, useEffect } from 'react'

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

type FilterTab = 'all' | 'long' | 'short' | 'trending'

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
      <polyline points={pts} fill="none" stroke={positive ? '#26a69a' : '#ef5350'} strokeWidth={1.5} />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: '#1e222d',
        border: '1px solid #2a2e39',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          className="animate-pulse"
          style={{ width: 72, height: 22, borderRadius: 4, background: '#2a2e39' }}
        />
        <div
          className="animate-pulse"
          style={{ width: 48, height: 22, borderRadius: 4, background: '#2a2e39' }}
        />
        <div style={{ marginLeft: 'auto' }}>
          <div
            className="animate-pulse"
            style={{ width: 48, height: 20, borderRadius: 4, background: '#2a2e39' }}
          />
        </div>
      </div>
      <div
        className="animate-pulse"
        style={{ width: 60, height: 32, borderRadius: 4, background: '#2a2e39' }}
      />
      <div
        className="animate-pulse"
        style={{ width: '80%', height: 16, borderRadius: 4, background: '#2a2e39' }}
      />
      <div
        className="animate-pulse"
        style={{ width: '100%', height: 12, borderRadius: 4, background: '#2a2e39' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div
          className="animate-pulse"
          style={{ width: 24, height: 24, borderRadius: '50%', background: '#2a2e39' }}
        />
        <div
          className="animate-pulse"
          style={{ width: 64, height: 12, borderRadius: 4, background: '#2a2e39' }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <div
            className="animate-pulse"
            style={{ width: 32, height: 12, borderRadius: 4, background: '#2a2e39' }}
          />
          <div
            className="animate-pulse"
            style={{ width: 32, height: 12, borderRadius: 4, background: '#2a2e39' }}
          />
          <div
            className="animate-pulse"
            style={{ width: 32, height: 12, borderRadius: 4, background: '#2a2e39' }}
          />
        </div>
      </div>
    </div>
  )
}

function DirectionBadge({ direction }: { direction: Idea['direction'] }) {
  const config = {
    long: { label: 'LONG', bg: 'rgba(38, 166, 154, 0.15)', color: '#26a69a' },
    short: { label: 'SHORT', bg: 'rgba(239, 83, 80, 0.15)', color: '#ef5350' },
    neutral: { label: 'NEUTRAL', bg: 'rgba(120, 123, 134, 0.15)', color: '#787b86' },
  }
  const { label, bg, color } = config[direction]
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 3,
        background: bg,
        color,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  )
}

function IdeaCard({ idea }: { idea: Idea }) {
  const isPositive = idea.direction !== 'short'
  return (
    <div
      style={{
        background: '#1e222d',
        border: '1px solid #2a2e39',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#363a45')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2e39')}
    >
      {/* Header: symbol + exchange + direction */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          className="tv-num"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#d1d4dc',
            background: '#2a2e39',
            padding: '3px 8px',
            borderRadius: 4,
          }}
        >
          {idea.symbol}
        </span>
        <span style={{ fontSize: 11, color: '#787b86' }}>{idea.exchange}</span>
        <div style={{ marginLeft: 'auto' }}>
          <DirectionBadge direction={idea.direction} />
        </div>
      </div>

      {/* Sparkline */}
      <Sparkline data={idea.chartData} positive={isPositive} />

      {/* Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#d1d4dc',
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {idea.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 12,
          color: '#787b86',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {idea.description}
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 'auto',
          paddingTop: 4,
          flexWrap: 'wrap',
        }}
      >
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {idea.author.avatar ? (
            <img
              src={idea.author.avatar}
              alt=""
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#2962ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {idea.author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontSize: 11,
              color: '#787b86',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 80,
            }}
          >
            {idea.author.name}
          </span>
        </div>

        {/* Timeframe badge */}
        <span
          className="tv-num"
          style={{
            fontSize: 10,
            color: '#787b86',
            background: '#2a2e39',
            padding: '2px 5px',
            borderRadius: 3,
          }}
        >
          {idea.timeframe}
        </span>

        {/* Stats */}
        <div
          className="tv-num"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginLeft: 'auto',
            fontSize: 11,
            color: '#787b86',
          }}
        >
          <span>👍 {idea.likes}</span>
          <span>💬 {idea.comments}</span>
          <span>👁 {idea.views}</span>
        </div>

        {/* Time ago */}
        <span style={{ fontSize: 10, color: '#787b86', whiteSpace: 'nowrap' }}>
          {idea.createdAt}
        </span>
      </div>
    </div>
  )
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'long', label: 'Long' },
  { key: 'short', label: 'Short' },
  { key: 'trending', label: 'Trending' },
]

export default function CommunityPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    let cancelled = false
    async function fetchIdeas() {
      setLoading(true)
      try {
        const res = await fetch('/api/community')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        if (!cancelled) setIdeas(json.ideas ?? [])
      } catch {
        if (!cancelled) setIdeas([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchIdeas()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = (() => {
    let result = ideas

    // Client-side search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (idea) =>
          idea.title.toLowerCase().includes(q) ||
          idea.symbol.toLowerCase().includes(q) ||
          idea.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Tab filter
    if (activeTab === 'long') {
      result = result.filter((idea) => idea.direction === 'long')
    } else if (activeTab === 'short') {
      result = result.filter((idea) => idea.direction === 'short')
    } else if (activeTab === 'trending') {
      result = [...result].sort((a, b) => b.views - a.views)
    }

    return result
  })()

  return (
    <div style={{ minHeight: '100vh', background: '#131722', padding: '24px 24px 48px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#d1d4dc', margin: 0, whiteSpace: 'nowrap' }}>
          Community Ideas
        </h1>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <input
            type="text"
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: '#1e222d',
              border: '1px solid #2a2e39',
              borderRadius: 6,
              color: '#d1d4dc',
              fontSize: 13,
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#2962ff')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2e39')}
          />
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#787b86"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === tab.key ? '#2962ff' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#787b86',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) e.currentTarget.style.color = '#d1d4dc'
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) e.currentTarget.style.color = '#787b86'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
        className="community-grid"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length > 0
            ? filtered.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
            : !loading && ideas.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: 48,
                      color: '#787b86',
                      fontSize: 14,
                    }}
                  >
                    No ideas match your search.
                  </div>
                )}
      </div>

      <style jsx global>{`
        .community-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1024px) {
          .community-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .community-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
