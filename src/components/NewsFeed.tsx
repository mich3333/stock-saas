'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { MOCK_NEWS, NewsItem } from '@/lib/stockData'

const sentimentStyles = {
  positive: { icon: TrendingUp, color: '#26a69a', bg: 'rgba(38,166,154,0.1)' },
  negative: { icon: TrendingDown, color: '#ef5350', bg: 'rgba(239,83,80,0.1)' },
  neutral: { icon: Minus, color: '#787B86', bg: 'rgba(120,123,134,0.1)' },
}

interface NewsFeedProps {
  collapsed: boolean
  onToggle: () => void
}

export function NewsFeed({ collapsed, onToggle }: NewsFeedProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'ideas'>('news')

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center py-4 gap-3 cursor-pointer"
        style={{ width: 40, background: '#1E222D', borderLeft: '1px solid #2A2E39' }}
      >
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC] transition-colors"
          title="Expand panel"
        >
          <ChevronLeft size={16} />
        </button>
        <Newspaper size={14} style={{ color: '#787B86' }} />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: 280, background: '#1E222D', borderLeft: '1px solid #2A2E39', flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: '1px solid #2A2E39' }}>
        <div className="flex gap-1">
          {(['news', 'ideas'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-2 py-1 text-xs rounded capitalize font-medium transition-colors"
              style={{
                background: activeTab === tab ? '#2A2E39' : 'transparent',
                color: activeTab === tab ? '#D1D4DC' : '#787B86',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#2A2E39] text-[#787B86] hover:text-[#D1D4DC] transition-colors"
          title="Collapse panel"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'news' && (
          <div>
            {MOCK_NEWS.map((item: NewsItem) => {
              const cfg = sentimentStyles[item.sentiment]
              const Icon = cfg.icon
              return (
                <a
                  key={item.id}
                  href={item.url}
                  className="flex gap-2 px-3 py-3 transition-colors"
                  style={{ borderBottom: '1px solid #2A2E39' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#131722')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={11} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug line-clamp-2 mb-1" style={{ color: '#D1D4DC' }}>
                      {item.headline}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.symbol && (
                        <span
                          className="text-[9px] px-1 py-0.5 rounded font-bold"
                          style={{ background: '#2A2E39', color: '#2962FF' }}
                        >
                          {item.symbol}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: '#787B86' }}>{item.source}</span>
                      <span className="text-[10px]" style={{ color: '#787B86' }}>·</span>
                      <span className="text-[10px]" style={{ color: '#787B86' }}>{item.time}</span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="p-3">
            <p className="text-xs text-center py-8" style={{ color: '#787B86' }}>
              Browse ideas in the{' '}
              <a href="/community" className="underline" style={{ color: '#2962FF' }}>
                Community
              </a>{' '}
              page
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
