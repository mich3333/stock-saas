'use client'

import { useState } from 'react'
import { ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { NewsItem, Sentiment } from '@/types/symbol'

const SENTIMENT_STYLES: Record<Sentiment, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positive', color: '#26a69a', bg: 'rgba(38,166,154,0.12)' },
  negative: { label: 'Negative', color: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
  neutral: { label: 'Neutral', color: '#787b86', bg: 'rgba(120,123,134,0.12)' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NewsCard({ item }: { item: NewsItem }) {
  const [showInsight, setShowInsight] = useState(false)
  const s = SENTIMENT_STYLES[item.sentiment]

  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={{ background: '#1e222d', borderColor: '#2a2e39' }}
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: s.bg, color: s.color }}
        >
          {s.label}
        </span>
        <span className="text-[11px]" style={{ color: '#787b86' }}>{item.source}</span>
        <span className="text-[11px]" style={{ color: '#4a4e58' }}>·</span>
        <span className="text-[11px]" style={{ color: '#787b86' }} suppressHydrationWarning>{timeAgo(item.publishedAt)}</span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex-shrink-0"
          style={{ color: '#787b86' }}
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Title */}
      <h4 className="text-[13px] font-medium leading-snug mb-2" style={{ color: '#d1d4dc' }}>
        {item.title}
      </h4>

      {/* Summary */}
      <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#787b86' }}>
        {item.summary}
      </p>

      {/* AI insight toggle */}
      <button
        onClick={() => setShowInsight(v => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
        style={{ color: showInsight ? '#2962ff' : '#787b86' }}
      >
        <Sparkles size={11} />
        Why this matters
        {showInsight ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {showInsight && (
        <div
          className="mt-2 px-3 py-2.5 rounded-md text-[12px] leading-relaxed"
          style={{ background: 'rgba(41,98,255,0.07)', color: '#b0b3bc', borderLeft: '2px solid #2962ff' }}
        >
          {item.aiInsight}
        </div>
      )}
    </div>
  )
}

interface Props {
  news: NewsItem[]
}

export function NewsTab({ news }: Props) {
  if (!news.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-3xl mb-3">📰</div>
        <p className="text-[14px] font-medium" style={{ color: '#d1d4dc' }}>No news available</p>
        <p className="text-[12px] mt-1" style={{ color: '#787b86' }}>Check back later for the latest coverage.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {news.map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  )
}
