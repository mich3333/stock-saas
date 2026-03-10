'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, PieChart, Plus, Trash2, Loader2 } from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Position {
  id?: string
  symbol: string
  shares: number
  avgPrice: number
  currentPrice: number | null
  change: number | null
  changePercent: number | null
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export function PortfolioTracker() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [newShares, setNewShares] = useState('')
  const [newAvgPrice, setNewAvgPrice] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      if (data.portfolio) setPositions(data.portfolio)
    } catch {
      // keep existing positions
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const addPosition = async () => {
    if (!newSymbol || !newShares || !newAvgPrice) return
    setAdding(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          shares: parseFloat(newShares),
          avg_price: parseFloat(newAvgPrice),
        }),
      })
      if (res.ok) {
        setNewSymbol('')
        setNewShares('')
        setNewAvgPrice('')
        setShowAddForm(false)
        await fetchPortfolio()
      }
    } finally {
      setAdding(false)
    }
  }

  const removePosition = async (id: string | undefined) => {
    if (!id) return
    await fetch('/api/portfolio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPositions(prev => prev.filter(p => p.id !== id))
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.currentPrice || p.avgPrice) * p.shares, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.avgPrice * p.shares, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const pieData = positions.map(p => ({
    name: p.symbol,
    value: (p.currentPrice || p.avgPrice) * p.shares,
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChart size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
        >
          <Plus size={14} /> Add Position
        </button>
      </div>

      {/* Add Position Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <input
                type="text"
                placeholder="Symbol"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Shares"
                value={newShares}
                onChange={e => setNewShares(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Avg Price"
                value={newAvgPrice}
                onChange={e => setNewAvgPrice(e.target.value)}
                className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addPosition}
                disabled={adding}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      ) : positions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No positions yet. Add your first stock!</p>
      ) : (
        <>
          {/* Summary */}
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

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="mb-6 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}

          {/* Positions List */}
          <div className="space-y-3">
            <AnimatePresence>
              {positions.map((pos, i) => {
                const value = (pos.currentPrice || pos.avgPrice) * pos.shares
                const cost = pos.avgPrice * pos.shares
                const gain = value - cost
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                return (
                  <motion.div key={pos.id || pos.symbol} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{pos.symbol}</p>
                          {gain >= 0 ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-500">{pos.shares} shares @ {formatCurrency(pos.avgPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
                        <p className={`text-xs font-medium ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({formatPercent(gainPct)})
                        </p>
                      </div>
                      <button
                        onClick={() => removePosition(pos.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}
