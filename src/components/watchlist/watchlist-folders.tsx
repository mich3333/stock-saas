'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, Plus, ChevronRight, Star } from 'lucide-react'

interface WatchlistFolder {
  id: string
  name: string
  stocks: string[]
  color: string
}

const DEFAULT_FOLDERS: WatchlistFolder[] = [
  { id: '1', name: 'Tech Giants', stocks: ['AAPL', 'GOOGL', 'MSFT', 'META'], color: 'blue' },
  { id: '2', name: 'EV Stocks', stocks: ['TSLA', 'RIVN', 'LCID'], color: 'green' },
  { id: '3', name: 'Dividends', stocks: ['JNJ', 'KO', 'PG', 'VZ'], color: 'purple' },
]

const ICON_COLORS: Record<string, string> = {
  blue: '#2962FF',
  green: '#26a69a',
  purple: '#8b5cf6',
}

export function WatchlistFolders() {
  const [folders] = useState(DEFAULT_FOLDERS)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['1']))

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={20} style={{ color: 'var(--accent)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Watchlists</h2>
        </div>
        <button
          className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={16} /> New List
        </button>
      </div>
      <div className="space-y-2">
        {folders.map((folder, i) => {
          const isOpen = openFolders.has(folder.id)
          const iconColor = ICON_COLORS[folder.color] ?? '#2962FF'
          return (
            <div key={folder.id}>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ background: `${iconColor}18`, color: iconColor }}
                >
                  {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
                </span>
                <span className="flex-1 text-left font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                  {folder.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{folder.stocks.length}</span>
                <ChevronRight
                  size={14}
                  style={{ color: 'var(--text-secondary)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                />
              </motion.button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-11 mt-1 space-y-1">
                      {folder.stocks.map(symbol => (
                        <div
                          key={symbol}
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{symbol}</span>
                        </div>
                      ))}
                      <button
                        className="flex items-center gap-1 text-xs py-1.5 px-3 transition-opacity hover:opacity-80"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Plus size={12} /> Add stock
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
