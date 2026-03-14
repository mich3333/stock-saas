'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TrendingUp, BarChart2, Bell, Shield, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['5 stocks watchlist', 'Real-time quotes', 'Basic charts', 'Market overview'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Unlimited watchlist',
      'Price alerts',
      'Advanced charts',
      'Technical indicators',
      'Portfolio tracking',
      'Priority support',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Team accounts',
      'White-label option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const FEATURES = [
  { icon: TrendingUp, title: 'Real-Time Data', desc: 'Live stock prices, charts, and market data powered by Yahoo Finance.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Set price alerts and never miss a trading opportunity.' },
  { icon: BarChart2, title: 'Advanced Analytics', desc: 'P/E ratio, market cap, volume, 52-week range and more.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with 99.9% uptime SLA.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Sub-second data updates with optimized infrastructure.' },
  { icon: Globe, title: 'Global Markets', desc: 'Track stocks from NYSE, NASDAQ, and global exchanges.' },
]

const DEMO_STOCKS = [
  { symbol: 'AAPL', price: '$189.30', change: '+1.25%', positive: true },
  { symbol: 'GOOGL', price: '$175.42', change: '-0.38%', positive: false },
  { symbol: 'MSFT', price: '$415.20', change: '+2.10%', positive: true },
  { symbol: 'TSLA', price: '$248.50', change: '+4.52%', positive: true },
]

async function handleCheckout(tier: 'pro' | 'enterprise') {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  })
  const { url, error } = await res.json()
  if (error) {
    window.location.href = '/register'
    return
  }
  if (url) window.location.href = url
}

export default function LandingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const onCheckout = async (plan: typeof PRICING[number]) => {
    if (plan.name === 'Free') {
      window.location.href = '/register'
      return
    }
    if (plan.name === 'Enterprise') {
      window.location.href = 'mailto:sales@stockflow.app'
      return
    }
    setCheckoutLoading(plan.name)
    await handleCheckout('pro')
    setCheckoutLoading(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={24} />
            <span className="font-bold text-xl">StockFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block bg-blue-500/10 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-blue-500/20">
              Real-time Stock Market Intelligence
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent leading-tight">
              Track Stocks.
              <br />
              Make Better Moves.
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Professional-grade stock analysis for individual investors. Real-time data, beautiful charts, and smart
              alerts.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Start Free Today</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Live ticker */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 flex justify-center gap-4 flex-wrap"
          >
            {DEMO_STOCKS.map((s, i) => (
              <motion.div
                key={s.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 flex items-center gap-3"
              >
                <span className="font-bold">{s.symbol}</span>
                <span className="text-gray-300">{s.price}</span>
                <span className={s.positive ? 'text-green-400' : 'text-red-400'}>{s.change}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Everything you need to trade smarter</h2>
            <p className="text-gray-400 text-lg">Powerful tools used by thousands of investors worldwide</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <f.icon className="text-blue-500 mb-4" size={28} />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-lg">Start free, upgrade when you&apos;re ready</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-8 border relative ${
                  plan.highlighted
                    ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm opacity-70">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-green-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => onCheckout(plan)}
                  disabled={checkoutLoading === plan.name}
                >
                  {checkoutLoading === plan.name ? 'Loading...' : plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-800 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp className="text-blue-500" size={18} />
          <span className="font-semibold text-white">StockFlow</span>
        </div>
        <p>© 2024 StockFlow. Built for serious investors.</p>
      </footer>
    </div>
  )
}
