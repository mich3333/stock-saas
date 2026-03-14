'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PricingCards from '@/components/PricingCards'
import { Check } from 'lucide-react'
import type { SubscriptionTier } from '@/lib/tier-limits'

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription at any time from the billing portal — no questions asked.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Pro comes with a 7-day free trial. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex) and bank transfers via Stripe.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time and we\'ll prorate the difference.',
  },
  {
    q: 'Do you offer team or enterprise plans?',
    a: 'Yes. Our Enterprise plan includes unlimited seats. Contact us for custom pricing.',
  },
]

const COMPARISON = [
  { feature: 'Watchlist symbols', free: '5', pro: '50', enterprise: 'Unlimited' },
  { feature: 'Real-time data', free: '15 min delay', pro: 'Real-time', enterprise: 'Real-time' },
  { feature: 'Chart indicators', free: '3', pro: 'All 20+', enterprise: 'All 20+' },
  { feature: 'Stock screener', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Heatmap', free: false, pro: true, enterprise: true },
  { feature: 'AI analysis', free: false, pro: true, enterprise: true },
  { feature: 'Portfolio tracking', free: false, pro: true, enterprise: true },
  { feature: 'API access', free: false, pro: false, enterprise: true },
  { feature: 'Priority support', free: false, pro: false, enterprise: true },
  { feature: 'Custom alerts', free: '2', pro: '50', enterprise: 'Unlimited' },
]

const BILLING_MESSAGES: Record<string, { tone: 'success' | 'warning' | 'error'; text: string }> = {
  checkout_canceled: { tone: 'warning', text: 'Checkout was canceled. Your current plan has not changed.' },
}

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check size={16} style={{ color: 'var(--green)' }} className="mx-auto" />
    ) : (
      <span className="text-[var(--text-secondary)]">—</span>
    )
  }
  return <span className="text-[var(--foreground)]">{value}</span>
}

function bannerClass(tone: 'success' | 'warning' | 'error') {
  if (tone === 'success') return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
  if (tone === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
}

function PricingPageContent() {
  const searchParams = useSearchParams()
  const billingState = searchParams.get('billing')
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free')
  const [portalError, setPortalError] = useState<string | null>(null)

  const banner = useMemo(() => (billingState ? BILLING_MESSAGES[billingState] : null), [billingState])

  useEffect(() => {
    fetch('/api/subscription')
      .then(async (response) => {
        if (!response.ok) return { tier: 'free' as SubscriptionTier }
        return response.json()
      })
      .then((payload) => setCurrentTier(payload.tier ?? 'free'))
      .catch(() => setCurrentTier('free'))
  }, [])

  const handleManageBilling = async () => {
    setPortalError(null)
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to open billing portal')
      window.location.href = payload.url
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : 'Unable to open billing portal')
    }
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <div className="pt-20 pb-24 px-4">
        <div className="text-center mb-16 max-w-5xl mx-auto glass-panel-strong rounded-[2rem] px-6 py-10 md:px-10 relative overflow-hidden">
          <div className="hero-orb h-40 w-40 bg-[var(--glow)] -top-10 left-10" />
          <div className="hero-orb h-32 w-32 bg-emerald-400/10 top-6 right-14" />
          <span className="section-kicker inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
            Simple, transparent pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--foreground)]">
            Invest in your edge
          </h1>
          <p className="text-lg max-w-xl mx-auto text-[var(--text-secondary)]">
            Professional-grade tools used by 50,000+ traders. Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-6 space-y-3">
          {banner && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${bannerClass(banner.tone)}`}>
              {banner.text}
            </div>
          )}
          {portalError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {portalError}
            </div>
          )}
        </div>

        <PricingCards currentTier={currentTier} onManageBilling={handleManageBilling} />

        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-[var(--foreground)]">
            Full feature comparison
          </h2>

          <div className="glass-panel-strong rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--panel-muted)]">
                  <th className="text-left px-6 py-4 font-medium text-[var(--text-secondary)]">Feature</th>
                  <th className="text-center px-4 py-4 font-medium text-[var(--text-secondary)]">Free</th>
                  <th className="text-center px-4 py-4 font-semibold text-[var(--accent)]">Pro</th>
                  <th className="text-center px-4 py-4 font-medium text-[var(--text-secondary)]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`${i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--panel)]/70'} border-t border-[var(--border)]`}
                  >
                    <td className="px-6 py-3.5 text-[var(--foreground)]">{row.feature}</td>
                    <td className="text-center px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                      <CellValue value={row.free} />
                    </td>
                    <td className="text-center px-4 py-3.5 text-sm">
                      <CellValue value={row.pro} />
                    </td>
                    <td className="text-center px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                      <CellValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-[var(--foreground)]">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((item) => (
              <div
                key={item.q}
                className="glass-panel-strong rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-2 text-[var(--foreground)]">{item.q}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <div className="glass-panel-strong inline-block rounded-[2rem] px-12 py-10">
            <h2 className="text-2xl font-bold mb-2 text-[var(--foreground)]">
              Ready to trade smarter?
            </h2>
            <p className="text-sm mb-6 text-[var(--text-secondary)]">
              Join 50,000+ traders using StockFlow to get an edge in the market.
            </p>
            <a
              href="/register"
              className="tv-btn-primary inline-block px-8 py-3 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start for free
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageContent />
    </Suspense>
  )
}
