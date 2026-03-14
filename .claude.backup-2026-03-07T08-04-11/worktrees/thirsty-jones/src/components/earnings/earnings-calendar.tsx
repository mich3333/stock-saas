'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, DollarSign } from 'lucide-react'

interface EarningsEvent {
  symbol: string
  date: string
  epsEstimate?: number
  revenueEstimate?: string
  period: string
}

const UPCOMING_EARNINGS: EarningsEvent[] = [
  { symbol: 'AAPL', date: 'Feb 1, 2025', period: 'Q1 2025', epsEstimate: 2.35 },
  { symbol: 'GOOGL', date: 'Feb 5, 2025', period: 'Q4 2024', epsEstimate: 2.15 },
  { symbol: 'MSFT', date: 'Jan 29, 2025', period: 'Q2 FY2025', epsEstimate: 3.10 },
  { symbol: 'AMZN', date: 'Feb 6, 2025', period: 'Q4 2024', epsEstimate: 1.49 },
  { symbol: 'META', date: 'Jan 29, 2025', period: 'Q4 2024', epsEstimate: 6.78 },
  { symbol: 'NVDA', date: 'Feb 26, 2025', period: 'Q4 FY2025', epsEstimate: 0.84 },
]

export function EarningsCalendar() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={20} className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Calendar</h2>
      </div>
      <div className="space-y-3">
        {UPCOMING_EARNINGS.map((e, i) => (
          <motion.div key={e.symbol} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">{e.symbol}</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{e.period}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{e.date}</p>
            </div>
            {e.epsEstimate && (
              <div className="text-right">
                <p className="text-xs text-gray-500">EPS Est.</p>
                <p className="font-semibold text-gray-900 dark:text-white">${e.epsEstimate}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
