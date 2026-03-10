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

const COLORS: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  green: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
}

export function WatchlistFolders() {
  const [folders, setFolders] = useState(DEFAULT_FOLDERS)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['1']))

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Watchlists</h2>
        </div>
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
          <Plus size={16} /> New List
        </button>
      </div>
      <div className="space-y-2">
        {folders.map((folder, i) => {
          const isOpen = openFolders.has(folder.id)
          return (
            <div key={folder.id}>
              <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <span className={`p-1.5 rounded-lg ${COLORS[folder.color]}`}>
                  {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
                </span>
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-white text-sm">{folder.name}</span>
                <span className="text-xs text-gray-400">{folder.stocks.length}</span>
                <ChevronRight size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </motion.button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="ml-11 mt-1 space-y-1">
                      {folder.stocks.map(symbol => (
                        <div key={symbol} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{symbol}</span>
                        </div>
                      ))}
                      <button className="flex items-center gap-1 text-xs text-blue-600 py-1.5 px-3 hover:text-blue-700">
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
