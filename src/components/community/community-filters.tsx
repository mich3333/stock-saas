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
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
          }`}
        >
          {activeTab === 'popular' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-blue-600 rounded-full"
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
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
          }`}
        >
          {activeTab === 'editors' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-blue-600 rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Editor&apos;s Picks</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors">
            <SlidersHorizontal size={14} />
            All Ideas
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <button className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
            <Video size={14} />
            Videos only
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
