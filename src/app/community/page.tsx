'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { IdeaCard, CommunityIdea } from '@/components/community/idea-card'
import { CommunityFilters } from '@/components/community/community-filters'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'popular' | 'editors'>('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [ideas, setIdeas] = useState<CommunityIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadIdeas() {
      try {
        setLoading(true)
        setError(null)
        const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
        const response = await fetch(`/api/community${query}`, { signal: controller.signal })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load ideas')
        }

        setIdeas(data.ideas || [])
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load ideas')
        setIdeas([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadIdeas()
    return () => controller.abort()
  }, [searchQuery])

  const displayedIdeas = useMemo(() => {
    if (activeTab === 'editors') {
      return ideas.filter((_, index) => index % 3 === 0)
    }
    return ideas
  }, [activeTab, ideas])

  return (
    <div className="app-shell min-h-screen">
      <nav className="glass-panel sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="text-[var(--accent)]" size={24} />
              <span className="font-bold text-xl text-[var(--foreground)]">StockFlow</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                Dashboard
              </Link>
              <Link href="/community" className="text-sm font-medium text-[var(--accent)]">
                Community
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-12 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center glass-panel-strong rounded-[2rem] px-5 py-10 md:px-10 relative overflow-hidden">
          <div className="hero-orb h-40 w-40 bg-[var(--glow)] -top-10 left-16" />
          <div className="hero-orb h-32 w-32 bg-emerald-400/10 top-8 right-16" />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-3"
          >
            Community Ideas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto mb-8"
          >
            Live community ideas with real charts and live engagement counts
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-md mx-auto relative mb-8"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input
              type="text"
              placeholder="Search ideas by symbol, title, or tag..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] text-sm focus:outline-none placeholder:text-[var(--text-secondary)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CommunityFilters
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {error ? (
          <div className="glass-panel rounded-[1.5rem] p-6 text-center text-[var(--text-secondary)]">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-panel-strong rounded-[1.6rem] h-[360px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'grid grid-cols-1 gap-4'
          }>
            {displayedIdeas.map((idea, index) => (
              <IdeaCard key={idea.id} idea={idea} index={index} />
            ))}
          </div>
        )}

        {!loading && !error && displayedIdeas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-[var(--text-secondary)]"
          >
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p>No live ideas found yet</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
