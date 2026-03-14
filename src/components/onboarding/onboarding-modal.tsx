'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Bell, BarChart2, ChevronRight, X } from 'lucide-react'

const STEPS = [
  {
    icon: TrendingUp,
    title: 'Welcome to StockFlow',
    description: 'Your professional-grade stock market dashboard. Track real-time prices, build watchlists, and make smarter investment decisions.',
    accent: '#2962FF',
    badge: 'Step 1 of 3',
    highlight: 'Real-time data. Zero delays.',
  },
  {
    icon: BarChart2,
    title: 'Add Stocks to Your Watchlist',
    description: 'Search any ticker and add it to your watchlist. Watch live price movements and build your personal market view from the sidebar.',
    accent: '#26a69a',
    badge: 'Step 2 of 3',
    highlight: 'Your portfolio, your way.',
  },
  {
    icon: Bell,
    title: 'View Charts & Set Alerts',
    description: 'Interactive candlestick charts with RSI, MACD, and Bollinger Bands. Set price alerts and get notified the moment a stock crosses your threshold.',
    accent: '#F39C12',
    badge: 'Step 3 of 3',
    highlight: 'Never miss a move.',
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const forceOpen = searchParams.get('onboarding') === 'true'
    if (forceOpen || !localStorage.getItem('stockflow-onboarding')) {
      setTimeout(() => setOpen(true), 400)
    }
  }, [searchParams])

  const finish = () => {
    localStorage.setItem('stockflow-onboarding', 'true')
    setOpen(false)
    // Remove query param without navigation flash
    if (searchParams.get('onboarding')) {
      router.replace(pathname, { scroll: false })
    }
  }

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-full max-w-sm relative rounded-2xl overflow-hidden"
            style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}
          >
            {/* Close */}
            <button
              onClick={finish}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={16} />
            </button>

            {/* Progress bar */}
            <div className="flex gap-1.5 px-6 pt-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i <= step ? current.accent : 'var(--panel-muted)' }}
                />
              ))}
            </div>

            {/* Step content */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
              className="px-6 py-8 text-center"
            >
              {/* Step badge */}
              <div className="flex justify-center mb-4">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                  style={{ background: `${current.accent}22`, color: current.accent }}
                >
                  {current.badge}
                </span>
              </div>
              {/* Icon */}
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: `${current.accent}18`, border: `1px solid ${current.accent}33` }}
              >
                <Icon size={28} style={{ color: current.accent }} />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>{current.title}</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{current.description}</p>
              {/* Highlight pill */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: current.accent }} />
                {current.highlight}
              </div>
            </motion.div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                onClick={finish}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Skip
              </button>
              <button
                onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: current.accent, color: '#fff' }}
              >
                {step < STEPS.length - 1 ? (
                  <><span>Next</span><ChevronRight size={14} /></>
                ) : (
                  <span>Get Started</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
