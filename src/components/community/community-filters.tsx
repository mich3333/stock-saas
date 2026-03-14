'use client'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Video, Grid3X3, LayoutList } from 'lucide-react'

interface CommunityFiltersProps {
  activeTab: 'popular' | 'editors'
  setActiveTab: (tab: 'popular' | 'editors') => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
}

export function CommunityFilters({ activeTab, setActiveTab, viewMode, setViewMode }: CommunityFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Toggle pills */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setActiveTab('popular')}
          className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeTab === 'popular'
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] bg-[var(--panel)]'
          }`}
        >
          {activeTab === 'popular' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-[var(--accent)] rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Popular</span>
        </button>
        <button
          onClick={() => setActiveTab('editors')}
          className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeTab === 'editors'
              ? 'text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] bg-[var(--panel)]'
          }`}
        >
          {activeTab === 'editors' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-[var(--accent)] rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Editor&apos;s Picks</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="glass-panel-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
            <SlidersHorizontal size={14} />
            All Ideas
          </button>
          <div className="w-px h-5 bg-[var(--border)]" />
          <button className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <Video size={14} />
            Videos only
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
