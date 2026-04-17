'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Zap, Building2, CheckCircle, CalendarClock, CircleAlert, WalletCards } from 'lucide-react'
import { PLANS } from '@/lib/stripe'
import type { Subscription } from '@/types'
import type { SubscriptionTier } from '@/lib/tier-limits'

interface SubscriptionData {
  tier: SubscriptionTier
  subscription: Subscription | null
}

const BILLING_MESSAGES: Record<string, { tone: 'success' | 'warning' | 'error'; text: string }> = {
  checkout_success: { tone: 'success', text: 'Checkout completed. Your billing status is refreshing now.' },
  checkout_canceled: { tone: 'warning', text: 'Checkout was canceled. You can upgrade again whenever you are ready.' },
  portal_returned: { tone: 'success', text: 'Returned from the billing portal.' },
}

function bannerClass(tone: 'success' | 'warning' | 'error') {
  if (tone === 'success') return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
  if (tone === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
}

export function SubscriptionStatus() {
  const searchParams = useSearchParams()
  const billingState = searchParams.get('billing')

  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const banner = billingState ? BILLING_MESSAGES[billingState] : null

  const fetchSubscription = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription')
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Unable to load billing status')
      setData(payload)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load billing status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSubscription()
  }, [billingState])

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    setActionError(null)
    setUpgrading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Unable to start checkout')
      window.location.href = payload.url
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to start checkout')
    } finally {
      setUpgrading(null)
    }
  }

  const handleBillingPortal = async (intent: 'payment-method' | 'subscription') => {
    setActionError(null)
    setPortalLoading(intent)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Unable to open billing portal')
      window.location.href = payload.url
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to open billing portal')
    } finally {
      setPortalLoading(null)
    }
  }

  const tier = data?.tier ?? 'free'
  const plan = PLANS[tier]
  const subscription = data?.subscription
  const hasPaidPlan = tier !== 'free'

  const tierIcon = {
    free: <Zap size={20} className="text-gray-400" />,
    pro: <CreditCard size={20} className="text-[var(--accent)]" />,
    enterprise: <Building2 size={20} className="text-purple-500" />,
  }[tier]

  const nextBillingLabel = useMemo(() => {
    if (!subscription?.current_period_end) return null
    const formatted = new Date(subscription.current_period_end).toLocaleDateString()
    return subscription.cancel_at_period_end ? `Cancels on ${formatted}` : `Renews on ${formatted}`
  }, [subscription])

  if (loading) {
    return (
      <div className="glass-panel-strong rounded-[1.75rem] p-6 animate-pulse h-72" />
    )
  }

  return (
    <div className="glass-panel-strong rounded-[1.75rem] p-6">
      <div className="flex flex-col gap-4">
        {banner && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${bannerClass(banner.tone)}`}>
            {banner.text}
          </div>
        )}

        {actionError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {actionError}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
              {tierIcon}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{plan.name} Plan</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
              </p>
            </div>
          </div>
          <Badge
            className={
              tier === 'enterprise'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : tier === 'pro'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-4">
            <div className="ticker-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Subscription status</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className={`font-semibold ${
                subscription?.status === 'active' || subscription?.status === 'trialing'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {subscription?.status ?? 'free'}
              </span>
              {subscription?.cancel_at_period_end && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                  Cancels at period end
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-4">
            <div className="ticker-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Billing cycle</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--foreground)]">
              <CalendarClock size={15} className="text-[var(--accent)]" />
              <span>{nextBillingLabel ?? 'No active billing cycle yet'}</span>
            </div>
          </div>
        </div>

        {!hasPaidPlan && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <p className="text-sm text-[var(--foreground)] font-medium">Upgrade to unlock:</p>
            <ul className="mt-3 space-y-2">
              {['Unlimited watchlist stocks', 'Price alerts via email', 'CSV export', 'API access (Enterprise)'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle size={14} className="shrink-0 text-[var(--green)]" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <Button
                size="sm"
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading !== null}
                className="w-full"
              >
                {upgrading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpgrade('enterprise')}
                disabled={upgrading !== null}
                className="w-full"
              >
                {upgrading === 'enterprise' ? 'Redirecting...' : 'Upgrade to Enterprise'}
              </Button>
            </div>
          </div>
        )}

        {hasPaidPlan && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-start gap-3">
              <WalletCards size={18} className="mt-0.5 text-[var(--accent)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">Billing actions</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Manage your payment method, invoices, renewal preferences, and cancellation inside the Stripe billing portal.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBillingPortal('payment-method')}
                disabled={portalLoading !== null}
              >
                {portalLoading === 'payment-method' ? 'Loading...' : 'Manage payment method'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBillingPortal('subscription')}
                disabled={portalLoading !== null}
              >
                {portalLoading === 'subscription' ? 'Loading...' : 'Manage subscription'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBillingPortal('subscription')}
                disabled={portalLoading !== null}
              >
                {portalLoading === 'subscription' ? 'Loading...' : 'Open billing portal'}
              </Button>
            </div>
            {subscription?.status === 'past_due' && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <span>Your latest payment failed. Update your payment method in the billing portal to restore paid access.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
