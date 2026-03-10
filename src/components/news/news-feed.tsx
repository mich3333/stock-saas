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
  positive: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Negative' },
  neutral: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/50', label: 'Neutral' },
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">News — {symbol}</h2>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No recent news</p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {news.map((item, i) => {
              const sentiment = getSentiment(item.title)
              const config = sentimentConfig[sentiment]
              const SentimentIcon = config.icon
              return (
                <motion.a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.bg}`}>
                    <SentimentIcon size={14} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{item.publisher}</span>
                      <span className="text-gray-300">·</span>
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-xs text-gray-400">{timeAgo(item.providerPublishTime)}</span>
                      <span className="text-gray-300">·</span>
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                </motion.a>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
