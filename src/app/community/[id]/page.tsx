'use client'
import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, MessageCircle, Eye, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

type IdeaDetail = {
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
  chartData: { date: string; close: number }[]
  liked: boolean
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

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'absolute'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!copied) {
    throw new Error('Copy failed')
  }
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [idea, setIdea] = useState<IdeaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likeLoading, setLikeLoading] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadIdea() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/community/${id}`, { signal: controller.signal })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load idea')
        }

        setIdea(data.idea)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load idea')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadIdea()
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!shareFeedback) return
    const timeoutId = window.setTimeout(() => setShareFeedback(''), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [shareFeedback])

  const handleLike = async () => {
    if (!idea || likeLoading) return

    try {
      setLikeLoading(true)
      const response = await fetch(`/api/community/${idea.id}`, { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like')
      }

      setIdea((current) => current ? { ...current, liked: data.liked, likes: data.likes } : current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like')
    } finally {
      setLikeLoading(false)
    }
  }

  const handleShare = async () => {
    if (!idea) return

    const shareUrl = window.location.href
    const shareData = {
      title: idea.title,
      text: `${idea.symbol} idea on StockFlow`,
      url: shareUrl,
    }
    const canUseNativeShare = typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches

    try {
      if (canUseNativeShare) {
        await navigator.share(shareData)
        setShareFeedback('Shared')
        return
      }

      await copyToClipboard(shareUrl)
      setShareFeedback('Link copied')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        try {
          await copyToClipboard(shareUrl)
          setShareFeedback('Link copied')
          return
        } catch {
          setShareFeedback('')
          return
        }
      }

      try {
        await copyToClipboard(shareUrl)
        setShareFeedback('Link copied')
      } catch {
        setShareFeedback('Could not share')
      }
    }
  }

  const dir = idea ? directionConfig[idea.direction] : null
  const chartData = useMemo(() => idea?.chartData ?? [], [idea?.chartData])

  if (loading) {
    return <div className="min-h-screen app-shell flex items-center justify-center text-[var(--text-secondary)]">Loading live idea...</div>
  }

  if (error || !idea || !dir) {
    return (
      <div className="min-h-screen app-shell flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-lg text-[var(--foreground)]">{error || 'Idea not found'}</p>
        <Link href="/community" className="text-sm text-[var(--accent)]">Back to Community</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#131722', color: '#D1D4DC' }}>
      <div className="flex items-center h-12 px-4 gap-3" style={{ background: '#1E222D', borderBottom: '1px solid #2A2E39' }}>
        <Link href="/community" className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity" style={{ color: '#787B86' }}>
          <ArrowLeft size={16} />
          Community
        </Link>
        <span style={{ color: '#2A2E39' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: '#2962FF' }}>{idea.symbol}</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
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

        <div className="rounded mb-6" style={{ background: '#1E222D', border: '1px solid #2A2E39', padding: '16px' }}>
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
              <YAxis tick={{ fontSize: 11, fill: '#787B86' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E222D', border: '1px solid #2A2E39', borderRadius: 4, color: '#D1D4DC', fontSize: 12 }}
                formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, 'Price']}
              />
              <Area type="monotone" dataKey="close" stroke={dir.color} strokeWidth={2} fill="url(#ideaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 rounded p-4" style={{ background: '#1E222D', border: '1px solid #2A2E39' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#D1D4DC' }}>Analysis</h2>
            {idea.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-sm mb-3 last:mb-0 leading-relaxed" style={{ color: '#787B86' }}>
                {paragraph}
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
                onClick={handleLike}
                disabled={likeLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium transition-colors disabled:opacity-70"
                style={{ background: idea.liked ? '#1f8f6a' : '#2962FF', color: '#fff' }}
                aria-pressed={idea.liked}
              >
                <Heart size={12} fill={idea.liked ? 'currentColor' : 'none'} /> {idea.liked ? 'Liked' : 'Like'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{ background: '#2A2E39', color: '#D1D4DC' }}
                aria-label="Share idea"
              >
                <Share2 size={12} />
              </button>
            </div>
            {shareFeedback ? (
              <p className="mt-3 text-xs" style={{ color: '#787B86' }}>
                {shareFeedback}
              </p>
            ) : null}
          </div>
        </div>

        <Link href="/community" className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#2962FF' }}>
          ← Back to all ideas
        </Link>
      </div>
    </div>
  )
}
