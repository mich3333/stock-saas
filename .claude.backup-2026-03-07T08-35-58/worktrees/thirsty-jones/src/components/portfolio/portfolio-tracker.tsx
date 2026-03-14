'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'

interface Position {
  symbol: string
  shares: number
  avgPrice: number
  currentPrice?: number
  change?: number
  changePercent?: number
}

export function PortfolioTracker() {
  const [positions, setPositions] = useState<Position[]>([
    { symbol: 'AAPL', shares: 10, avgPrice: 150.00, currentPrice: 189.30, change: 39.30, changePercent: 26.2 },
    { symbol: 'GOOGL', shares: 5, avgPrice: 140.00, currentPrice: 175.42, change: 35.42, changePercent: 25.3 },
    { symbol: 'MSFT', shares: 8, avgPrice: 380.00, currentPrice: 415.20, change: 35.20, changePercent: 9.26 },
    { symbol: 'TSLA', shares: 3, avgPrice: 200.00, currentPrice: 248.50, change: 48.50, changePercent: 24.25 },
  ])

  const totalValue = positions.reduce((sum, p) => sum + (p.currentPrice || 0) * p.shares, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.avgPrice * p.shares, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = (totalGain / totalCost) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <PieChart size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Gain</p>
          <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(totalGain)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
          <p className={`text-xl font-bold ${totalGainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatPercent(totalGainPercent)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {positions.map((pos, i) => {
            const isPositive = (pos.change || 0) >= 0
            const value = (pos.currentPrice || 0) * pos.shares
            const cost = pos.avgPrice * pos.shares
            const gain = value - cost
            return (
              <motion.div key={pos.symbol} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{pos.symbol}</p>
                  <p className="text-xs text-gray-500">{pos.shares} shares @ {formatCurrency(pos.avgPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
                  <p className={`text-xs font-medium ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({formatPercent(pos.changePercent || 0)})
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
