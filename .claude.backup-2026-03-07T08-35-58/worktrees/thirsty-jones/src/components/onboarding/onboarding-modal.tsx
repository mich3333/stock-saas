'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Bell, BarChart2, Shield, ChevronRight, X } from 'lucide-react'

const STEPS = [
  { icon: TrendingUp, title: 'Welcome to StockFlow!', description: 'Your professional stock market dashboard. Track real-time prices and make informed decisions.', color: 'bg-blue-500' },
  { icon: BarChart2, title: 'Advanced Charts', description: 'Candlestick charts, RSI, MACD, and Bollinger Bands for deep analysis.', color: 'bg-purple-500' },
  { icon: Bell, title: 'Smart Price Alerts', description: 'Set alerts for any price level. Available on Pro plan.', color: 'bg-yellow-500' },
  { icon: Shield, title: 'Secure & Reliable', description: "Enterprise-grade security. Let's get you set up!", color: 'bg-green-500' },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('stockflow-onboarding')) setTimeout(() => setOpen(true), 1000)
  }, [])

  const finish = () => { localStorage.setItem('stockflow-onboarding', 'true'); setOpen(false) }
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={finish} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="flex gap-1.5 mb-8">
              {STEPS.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`} />)}
            </div>
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${current.color} mb-6`}>
                <Icon size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{current.title}</h2>
              <p className="text-gray-500 dark:text-gray-400">{current.description}</p>
            </motion.div>
            <div className="flex items-center justify-between mt-8">
              <button onClick={finish} className="text-sm text-gray-400">Skip</button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium">
                {step < STEPS.length - 1 ? <><span>Next</span><ChevronRight size={16} /></> : <span>Get Started</span>}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
