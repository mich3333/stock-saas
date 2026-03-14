'use client'

import { useState } from 'react'
import { PLANS, PlanKey } from '@/lib/stripe'

interface PricingCardsProps {
  currentTier?: PlanKey
  onManageBilling?: () => Promise<void> | void
}

export default function PricingCards({ currentTier = 'free', onManageBilling }: PricingCardsProps) {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleSubscribe(tier: PlanKey) {
    if (tier === 'free' || tier === currentTier) return
    setActionError(null)
    setLoading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to start checkout')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to start checkout')
    } finally {
      setLoading(null)
    }
  }

  const tiers: PlanKey[] = ['free', 'pro', 'enterprise']

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {actionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
        const plan = PLANS[tier]
        const isCurrent = tier === currentTier
        const isPopular = tier === 'pro'

        return (
          <div
            key={tier}
            className={`relative rounded-[1.75rem] border p-8 flex flex-col backdrop-blur-xl ${
              isPopular
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--panel-strong)_90%,transparent)] shadow-[0_24px_60px_var(--glow)]'
                : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] shadow-[var(--shadow-lg)]'
            }`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-[0_10px_24px_var(--glow)]">
                Most Popular
              </div>
            )}

            <h3 className="text-lg font-semibold text-[var(--foreground)]">{plan.name}</h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[var(--foreground)]">
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span className="ticker-mono text-[var(--text-secondary)] text-sm">/month</span>
              )}
            </div>

            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (isCurrent && currentTier !== 'free' && onManageBilling) {
                  void onManageBilling()
                  return
                }
                void handleSubscribe(tier)
              }}
              disabled={(tier === 'free' && currentTier === 'free') || loading !== null}
              className={`mt-8 w-full py-3 px-4 rounded-full font-medium text-sm transition-colors ${
                isCurrent
                  ? currentTier === 'free'
                    ? 'bg-[var(--panel-muted)] text-[var(--text-secondary)] cursor-default border border-[var(--border)]'
                    : 'bg-[var(--panel-muted)] hover:bg-[var(--accent-soft)] text-[var(--foreground)] border border-[var(--border)]'
                  : isPopular
                    ? 'bg-[var(--accent)] hover:opacity-90 text-white'
                    : 'bg-[var(--panel-muted)] hover:bg-[var(--accent-soft)] text-[var(--foreground)] border border-[var(--border)]'
              } disabled:opacity-50`}
            >
              {loading === tier
                ? 'Redirecting...'
                : isCurrent
                  ? currentTier === 'free'
                    ? 'Current Plan'
                    : 'Manage billing'
                  : tier === 'free'
                    ? 'Free Forever'
                    : `Upgrade to ${plan.name}`}
            </button>
          </div>
        )
        })}
      </div>
    </div>
  )
}
