'use client'

import Link from 'next/link'
import { ThumbsUp, MessageSquare, Eye } from 'lucide-react'

interface IdeaCardProps {
  symbol: string
  title: string
  author: string
  authorInitials: string
  avatarColor: string
  direction: 'Long' | 'Short'
  timeframe: string
  likes: number
  comments: number
  views: string
  chartColor: string
}

function MiniChart({ color }: { color: string }) {
  const isGreen = color === '#26A69A'
  const points = isGreen
    ? 'M0,60 L20,55 L40,48 L60,52 L80,42 L100,30 L120,22 L140,18 L160,12 L180,8'
    : 'M0,10 L20,15 L40,20 L60,18 L80,28 L100,38 L120,45 L140,50 L160,55 L180,62'

  return (
    <div
      className="w-full h-32 relative overflow-hidden rounded-t"
      style={{ backgroundColor: '#131722' }}
    >
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            y1={`${(i + 1) * 20}%`}
            x2="100%"
            y2={`${(i + 1) * 20}%`}
            stroke="#2A2E39"
            strokeWidth="1"
          />
        ))}
        {[1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={`${i * 25}%`}
            y1="0"
            x2={`${i * 25}%`}
            y2="100%"
            stroke="#2A2E39"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Chart line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 180 70" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polygon
          points={`${points},180,70 0,70`}
          fill={`url(#grad-${color})`}
        />
      </svg>
    </div>
  )
}

export default function IdeaCard({
  symbol,
  title,
  author,
  authorInitials,
  avatarColor,
  direction,
  timeframe,
  likes,
  comments,
  views,
  chartColor,
}: IdeaCardProps) {
  const isLong = direction === 'Long'

  return (
    <Link
      href="/community"
      className="rounded overflow-hidden cursor-pointer group block"
      style={{ backgroundColor: '#1E222D', border: '1px solid #2A2E39', textDecoration: 'none' }}
    >
      {/* Chart preview */}
      <div className="relative">
        <MiniChart color={chartColor} />
        {/* Symbol badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold"
          style={{ backgroundColor: '#131722', color: '#D1D4DC', border: '1px solid #2A2E39' }}
        >
          {symbol}
        </div>
        {/* Direction badge */}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold"
          style={{
            backgroundColor: isLong ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)',
            color: isLong ? '#26A69A' : '#EF5350',
            border: `1px solid ${isLong ? 'rgba(38,166,154,0.3)' : 'rgba(239,83,80,0.3)'}`,
          }}
        >
          {direction}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Title */}
        <p
          className="text-sm font-medium mb-3 leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors"
          style={{ color: '#D1D4DC' }}
        >
          {title}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor, color: '#fff' }}
          >
            {authorInitials}
          </div>
          <span className="text-xs" style={{ color: '#787B86' }}>
            {author}
          </span>
          <span className="text-xs ml-auto" style={{ color: '#787B86' }}>
            {timeframe}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid #2A2E39' }}>
          <div className="flex items-center gap-1">
            <ThumbsUp size={12} style={{ color: '#787B86' }} />
            <span className="text-xs" style={{ color: '#787B86' }}>
              {likes}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={12} style={{ color: '#787B86' }} />
            <span className="text-xs" style={{ color: '#787B86' }}>
              {comments}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Eye size={12} style={{ color: '#787B86' }} />
            <span className="text-xs" style={{ color: '#787B86' }}>
              {views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
