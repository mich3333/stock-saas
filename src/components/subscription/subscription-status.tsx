'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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

function bannerStyle(tone: 'success' | 'warning' | 'error'): React.CSSProperties {
  if (tone === 'success') return { border: '1px solid rgba(38,166,154,0.3)', background: 'rgba(38,166,154,0.1)', color: '#26a69a' }
  if (tone === 'warning') return { border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.1)', color: '#f5a623' }
  return { border: '1px solid rgba(239,83,80,0.3)', background: 'rgba(239,83,80,0.1)', color: '#ef5350' }
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
    free: <Zap size={20} style={{ color: '#787b86' }} />,
    pro: <CreditCard size={20} style={{ color: '#2962ff' }} />,
    enterprise: <Building2 size={20} style={{ color: '#2962ff' }} />,
  }[tier]

  const tierBadgeStyle: React.CSSProperties = tier === 'enterprise'
    ? { background: 'rgba(41,98,255,0.15)', color: '#2962ff', border: 'none', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }
    : tier === 'pro'
      ? { background: 'rgba(41,98,255,0.15)', color: '#2962ff', border: 'none', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }
      : { background: 'rgba(120,123,134,0.15)', color: '#787b86', border: 'none', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }

  const nextBillingLabel = useMemo(() => {
    if (!subscription?.current_period_end) return null
    const formatted = new Date(subscription.current_period_end).toLocaleDateString()
    return subscription.cancel_at_period_end ? `Cancels on ${formatted}` : `Renews on ${formatted}`
  }, [subscription])

  if (loading) {
    return (
      <div
        className="p-6 animate-pulse"
        style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6, minHeight: 288 }}
      />
    )
  }

  return (
    <div style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6, padding: 24 }}>
      <div className="flex flex-col gap-4">
        {banner && (
          <div className="px-4 py-3 text-sm" style={{ borderRadius: 6, ...bannerStyle(banner.tone) }}>
            {banner.text}
          </div>
        )}

        {actionError && (
          <div
            className="px-4 py-3 text-sm"
            style={{ borderRadius: 6, border: '1px solid rgba(239,83,80,0.3)', background: 'rgba(239,83,80,0.1)', color: '#ef5350' }}
          >
            {actionError}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center"
              style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6 }}
            >
              {tierIcon}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: '#d1d4dc' }}>{plan.name} Plan</h3>
              <p className="text-sm" style={{ color: '#787b86' }}>
                {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
              </p>
            </div>
          </div>
          <span style={tierBadgeStyle}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="px-4 py-4" style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6 }}>
            <div className="ticker-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: '#787b86' }}>Subscription status</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-semibold" style={{
                color: subscription?.status === 'active' || subscription?.status === 'trialing' ? '#26a69a' : '#ef5350'
              }}>
                {subscription?.status ?? 'free'}
              </span>
              {subscription?.cancel_at_period_end && (
                <span
                  className="px-2 py-0.5 text-xs"
                  style={{ borderRadius: 9999, background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}
                >
                  Cancels at period end
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-4" style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6 }}>
            <div className="ticker-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: '#787b86' }}>Billing cycle</div>
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#d1d4dc' }}>
              <CalendarClock size={15} style={{ color: '#2962ff' }} />
              <span>{nextBillingLabel ?? 'No active billing cycle yet'}</span>
            </div>
          </div>
        </div>

        {!hasPaidPlan && (
          <div className="p-4" style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6 }}>
            <p className="text-sm font-medium" style={{ color: '#d1d4dc' }}>Upgrade to unlock:</p>
            <ul className="mt-3 space-y-2">
              {['Unlimited watchlist stocks', 'Price alerts via email', 'CSV export', 'API access (Enterprise)'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: '#787b86' }}>
                  <CheckCircle size={14} className="shrink-0" style={{ color: '#26a69a' }} />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading !== null}
                className="w-full px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: '#2962ff', color: '#fff', borderRadius: 4, border: 'none' }}
              >
                {upgrading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
              <button
                onClick={() => handleUpgrade('enterprise')}
                disabled={upgrading !== null}
                className="w-full px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'transparent', color: '#d1d4dc', borderRadius: 4, border: '1px solid #2a2e39' }}
              >
                {upgrading === 'enterprise' ? 'Redirecting...' : 'Upgrade to Enterprise'}
              </button>
            </div>
          </div>
        )}

        {hasPaidPlan && (
          <div className="p-4" style={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 6 }}>
            <div className="flex items-start gap-3">
              <WalletCards size={18} className="mt-0.5" style={{ color: '#2962ff' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#d1d4dc' }}>Billing actions</p>
                <p className="mt-1 text-sm" style={{ color: '#787b86' }}>
                  Manage your payment method, invoices, renewal preferences, and cancellation inside the Stripe billing portal.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <button
                onClick={() => handleBillingPortal('payment-method')}
                disabled={portalLoading !== null}
                className="px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'transparent', color: '#d1d4dc', borderRadius: 4, border: '1px solid #2a2e39' }}
              >
                {portalLoading === 'payment-method' ? 'Loading...' : 'Manage payment method'}
              </button>
              <button
                onClick={() => handleBillingPortal('subscription')}
                disabled={portalLoading !== null}
                className="px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'transparent', color: '#d1d4dc', borderRadius: 4, border: '1px solid #2a2e39' }}
              >
                {portalLoading === 'subscription' ? 'Loading...' : 'Manage subscription'}
              </button>
              <button
                onClick={() => handleBillingPortal('subscription')}
                disabled={portalLoading !== null}
                className="px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'transparent', color: '#d1d4dc', borderRadius: 4, border: '1px solid #2a2e39' }}
              >
                {portalLoading === 'subscription' ? 'Loading...' : 'Open billing portal'}
              </button>
            </div>
            {subscription?.status === 'past_due' && (
              <div
                className="mt-4 flex items-start gap-2 px-4 py-3 text-sm"
                style={{ borderRadius: 6, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}
              >
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
