'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface NewsItem {
  title: string
  publisher: string
  link: string
  providerPublishTime: number
  type: string
}

interface NewsFeedProps {
  symbol: string
}

function getSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const lower = title.toLowerCase()
  const positiveWords = ['surge', 'soar', 'rally', 'gain', 'rise', 'jump', 'beat', 'record', 'high', 'boost', 'upgrade', 'buy', 'bullish', 'growth', 'profit', 'up ']
  const negativeWords = ['fall', 'drop', 'crash', 'plunge', 'decline', 'loss', 'miss', 'low', 'cut', 'downgrade', 'sell', 'bearish', 'down ', 'slump', 'warn', 'risk', 'fear']

  const posCount = positiveWords.filter(w => lower.includes(w)).length
  const negCount = negativeWords.filter(w => lower.includes(w)).length

  if (posCount > negCount) return 'positive'
  if (negCount > posCount) return 'negative'
  return 'neutral'
}

const sentimentConfig = {
  positive: { icon: TrendingUp, color: 'var(--green)', bg: 'rgba(38,166,154,0.12)', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'var(--red)', bg: 'rgba(239,83,80,0.12)', label: 'Negative' },
  neutral:  { icon: Minus,        color: 'var(--text-secondary)', bg: 'rgba(120,123,134,0.12)', label: 'Neutral' },
}

export function NewsFeed({ symbol }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      try {
        const res = await fetch(`/api/news/${symbol}`)
        const data = await res.json()
        setNews(data.news || [])
      } finally {
        setLoading(false)
      }
    }
    loadNews()
  }, [symbol])

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() / 1000 - timestamp
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--panel)',
        borderRadius: 16,
        padding: '1.5rem',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={20} style={{ color: 'var(--accent)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          News — {symbol}
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--border)' }}
            />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          No recent news
        </p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {news.map((item, i) => {
              const sentiment = getSentiment(item.title)
              const config = sentimentConfig[sentiment]
              const SentimentIcon = config.icon
              return (
                <motion.a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="flex-shrink-0 p-1.5 rounded-lg"
                    style={{ background: config.bg }}
                  >
                    <SentimentIcon size={14} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium line-clamp-2"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {item.publisher}
                      </span>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <Clock size={10} style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {timeAgo(item.providerPublishTime)}
                      </span>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <span className="text-xs font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="flex-shrink-0 mt-1" style={{ color: 'var(--text-secondary)' }} />
                </motion.a>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
