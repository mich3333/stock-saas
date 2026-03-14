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

const PIE_COLORS = ['#2962FF', '#26a69a', '#f59e0b', '#ef5350', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

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

  const inputStyle = {
    background: '#131722',
    border: '1px solid #2A2E39',
    color: '#D1D4DC',
    outline: 'none',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{ background: '#1E222D', border: '1px solid #2A2E39' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChart size={20} style={{ color: '#2962FF' }} />
          <h2 className="text-lg font-semibold" style={{ color: '#D1D4DC' }}>Portfolio</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'rgba(41,98,255,0.15)', color: '#2962FF' }}
        >
          <Plus size={14} /> Add Position
        </button>
      </div>

      {/* Add Position Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="flex gap-2 p-3 rounded-xl"
              style={{ background: '#131722', border: '1px solid #2A2E39' }}
            >
              <input
                type="text"
                placeholder="Symbol"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm rounded-lg"
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Shares"
                value={newShares}
                onChange={e => setNewShares(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm rounded-lg"
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Avg Price"
                value={newAvgPrice}
                onChange={e => setNewAvgPrice(e.target.value)}
                className="w-28 px-2 py-1.5 text-sm rounded-lg"
                style={inputStyle}
              />
              <button
                onClick={addPosition}
                disabled={adding}
                className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ background: '#2962FF', color: '#fff' }}
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: '#2A2E39' }}
            />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#787B86' }}>
          No positions yet. Add your first stock!
        </p>
      ) : (
        <>
          {/* Summary */}
          <div
            className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl"
            style={{ background: '#131722', border: '1px solid #2A2E39' }}
          >
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#787B86' }}>Total Value</p>
              <p className="text-xl font-bold" style={{ color: '#D1D4DC' }}>{formatCurrency(totalValue)}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#787B86' }}>Total Gain</p>
              <p
                className="text-xl font-bold"
                style={{ color: totalGain >= 0 ? '#26a69a' : '#ef5350' }}
              >
                {formatCurrency(totalGain)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: '#787B86' }}>Return</p>
              <p
                className="text-xl font-bold"
                style={{ color: totalGainPercent >= 0 ? '#26a69a' : '#ef5350' }}
              >
                {formatPercent(totalGainPercent)}
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="mb-6 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1E222D', border: '1px solid #2A2E39', borderRadius: 6, fontSize: 12 }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}

          {/* Positions List */}
          <div className="space-y-2">
            <AnimatePresence>
              {positions.map((pos, i) => {
                const value = (pos.currentPrice || pos.avgPrice) * pos.shares
                const cost = pos.avgPrice * pos.shares
                const gain = value - cost
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0
                return (
                  <motion.div
                    key={pos.id || pos.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors group"
                    style={{ background: '#131722', border: '1px solid #2A2E39' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#2A2E39')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2A2E39')}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{ color: '#D1D4DC' }}>{pos.symbol}</p>
                          {gain >= 0
                            ? <TrendingUp size={14} style={{ color: '#26a69a' }} />
                            : <TrendingDown size={14} style={{ color: '#ef5350' }} />
                          }
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#787B86' }}>
                          {pos.shares} shares @ {formatCurrency(pos.avgPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: '#D1D4DC' }}>{formatCurrency(value)}</p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: gain >= 0 ? '#26a69a' : '#ef5350' }}
                        >
                          {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({formatPercent(gainPct)})
                        </p>
                      </div>
                      <button
                        onClick={() => removePosition(pos.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                        style={{ color: '#787B86' }}
                        onMouseEnter={e => {
                          ;(e.currentTarget as HTMLElement).style.color = '#ef5350'
                          ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,83,80,0.12)'
                        }}
                        onMouseLeave={e => {
                          ;(e.currentTarget as HTMLElement).style.color = '#787B86'
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
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
