'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, DollarSign } from 'lucide-react'

interface EarningsEvent {
  symbol: string
  companyName: string
  reportDate: string
  epsEstimate: number | null
  period: string
}

interface GroupedEarnings {
  label: string
  items: EarningsEvent[]
}

function groupByWeek(earnings: EarningsEvent[]): GroupedEarnings[] {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfThisWeek = new Date(startOfWeek)
  endOfThisWeek.setDate(startOfWeek.getDate() + 7)

  const endOfNextWeek = new Date(endOfThisWeek)
  endOfNextWeek.setDate(endOfThisWeek.getDate() + 7)

  const groups: GroupedEarnings[] = [
    { label: 'This Week', items: [] },
    { label: 'Next Week', items: [] },
    { label: 'Upcoming', items: [] },
    { label: 'Past', items: [] },
  ]

  for (const e of earnings) {
    const d = new Date(e.reportDate)
    if (d < startOfWeek) {
      groups[3].items.push(e)
    } else if (d < endOfThisWeek) {
      groups[0].items.push(e)
    } else if (d < endOfNextWeek) {
      groups[1].items.push(e)
    } else {
      groups[2].items.push(e)
    }
  }

  return groups.filter(g => g.items.length > 0)
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEarnings() {
      try {
        const res = await fetch('/api/earnings')
        const data = await res.json()
        setEarnings(data.earnings || [])
      } catch {
        // keep empty
      } finally {
        setLoading(false)
      }
    }
    loadEarnings()
  }, [])

  const grouped = groupByWeek(earnings)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Calendar</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      ) : earnings.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No upcoming earnings data available</p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {group.items.map((e, i) => (
                    <motion.div key={`${e.symbol}-${e.reportDate}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{e.symbol}</span>
                          {e.period && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{e.period}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{e.companyName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(e.reportDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      {e.epsEstimate !== null && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">EPS Est.</p>
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            <DollarSign size={12} className="text-green-500" />
                            {e.epsEstimate.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
