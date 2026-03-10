'use client'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react'
import { formatCurrency, formatPercent, formatLargeNumber, cn } from '@/lib/utils'

interface StockCardProps {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number | null
  pe: number | null
  high52w: number
  low52w: number
  index?: number
  onAdd?: (symbol: string) => void
  inWatchlist?: boolean
}

export function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
  marketCap,
  pe,
  high52w,
  low52w,
  index = 0,
  onAdd,
  inWatchlist,
}: StockCardProps) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">{symbol}</span>
            <span
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercent(changePercent)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[150px]">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(price)}</p>
          <p className={cn('text-sm', isPositive ? 'text-green-500' : 'text-red-500')}>
            {isPositive ? '+' : ''}
            {formatCurrency(change)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-medium">Vol:</span> {formatLargeNumber(volume)}
        </div>
        {marketCap && (
          <div>
            <span className="font-medium">MCap:</span> {formatLargeNumber(marketCap)}
          </div>
        )}
        {pe && (
          <div>
            <span className="font-medium">P/E:</span> {pe.toFixed(2)}
          </div>
        )}
        <div>
          <span className="font-medium">52W:</span> {formatCurrency(low52w)} - {formatCurrency(high52w)}
        </div>
      </div>

      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(symbol)
          }}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg transition-colors',
            inWatchlist
              ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20'
          )}
        >
          {inWatchlist ? (
            <>
              <Minus size={12} /> Remove
            </>
          ) : (
            <>
              <Plus size={12} /> Watchlist
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}
