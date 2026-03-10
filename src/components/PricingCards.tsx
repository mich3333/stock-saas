'use client'

import { useState } from 'react'
import { PLANS, PlanKey } from '@/lib/stripe'

interface PricingCardsProps {
  currentTier?: PlanKey
}

export default function PricingCards({ currentTier = 'free' }: PricingCardsProps) {
  const [loading, setLoading] = useState<PlanKey | null>(null)

  async function handleSubscribe(tier: PlanKey) {
    if (tier === 'free' || tier === currentTier) return
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  const tiers: PlanKey[] = ['free', 'pro', 'enterprise']

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier) => {
        const plan = PLANS[tier]
        const isCurrent = tier === currentTier
        const isPopular = tier === 'pro'

        return (
          <div
            key={tier}
            className={`relative rounded-2xl border p-8 flex flex-col ${
              isPopular
                ? 'border-blue-500 bg-[#1a1f2e] shadow-lg shadow-blue-500/10'
                : 'border-gray-700 bg-[#131722]'
            }`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}

            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-400 text-sm">/month</span>
              )}
            </div>

            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(tier)}
              disabled={isCurrent || tier === 'free' || loading !== null}
              className={`mt-8 w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                isCurrent
                  ? 'bg-gray-700 text-gray-400 cursor-default'
                  : isPopular
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
              } disabled:opacity-50`}
            >
              {loading === tier
                ? 'Redirecting...'
                : isCurrent
                  ? 'Current Plan'
                  : tier === 'free'
                    ? 'Free Forever'
                    : `Upgrade to ${plan.name}`}
            </button>
          </div>
        )
      })}
    </div>
  )
}
