'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Heart, MessageCircle, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatLargeNumber } from '@/lib/utils'

export interface CommunityIdea {
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

const directionConfig = {
  long: { color: '#22c55e', gradientFrom: '#22c55e', label: 'Long', Icon: TrendingUp },
  short: { color: '#ef4444', gradientFrom: '#ef4444', label: 'Short', Icon: TrendingDown },
  neutral: { color: '#6b7280', gradientFrom: '#6b7280', label: 'Neutral', Icon: Minus },
}

export function IdeaCard({ idea, index = 0 }: { idea: CommunityIdea; index?: number }) {
  const dir = directionConfig[idea.direction]

  return (
    <Link href={`/community/${idea.id}`} style={{ textDecoration: 'none' }}>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-shadow"
    >
      {/* Chart area */}
      <div className="relative h-[150px] bg-gray-50 dark:bg-gray-900/50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={idea.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${idea.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dir.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={dir.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="close"
              stroke={dir.color}
              strokeWidth={2}
              fill={`url(#grad-${idea.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Symbol badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-black/70 dark:bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            {idea.symbol}
          </span>
          <span className="bg-black/50 dark:bg-white/10 backdrop-blur-sm text-gray-300 text-[11px] px-2 py-1 rounded-lg">
            {idea.timeframe} · {idea.exchange}
          </span>
        </div>

        {/* Direction badge */}
        <div className="absolute top-3 right-3">
          <span
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm"
            style={{ backgroundColor: `${dir.color}20`, color: dir.color }}
          >
            <dir.Icon size={11} />
            {dir.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
          {idea.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {idea.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Author + stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
              {idea.author.name[0]}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {idea.author.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <span className="flex items-center gap-1 text-[11px]">
              <Heart size={12} /> {formatLargeNumber(idea.likes)}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <MessageCircle size={12} /> {idea.comments}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Eye size={12} /> {formatLargeNumber(idea.views)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
    </Link>
  )
}
