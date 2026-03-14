'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Zap, Building2, CheckCircle } from 'lucide-react'
import { PLANS } from '@/lib/stripe'
import type { Subscription } from '@/types'
import type { SubscriptionTier } from '@/lib/tier-limits'

interface SubscriptionData {
  tier: SubscriptionTier
  subscription: Subscription | null
}

export function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    setUpgrading(tier)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Upgrade error:', err)
    } finally {
      setUpgrading(null)
    }
  }

  const handleBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse h-48" />
    )
  }

  const tier = data?.tier ?? 'free'
  const plan = PLANS[tier]
  const hasPaidPlan = tier !== 'free'

  const tierIcon = {
    free: <Zap size={20} className="text-gray-400" />,
    pro: <CreditCard size={20} className="text-blue-500" />,
    enterprise: <Building2 size={20} className="text-purple-500" />,
  }[tier]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {tierIcon}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name} Plan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {data?.subscription && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Status:{' '}
          <span
            className={
              data.subscription.status === 'active'
                ? 'text-green-600 dark:text-green-400 font-medium'
                : 'text-red-600 dark:text-red-400 font-medium'
            }
          >
            {data.subscription.status}
          </span>
          {data.subscription.current_period_end && (
            <span className="ml-2">
              &bull; Renews {new Date(data.subscription.current_period_end).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {!hasPaidPlan && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Upgrade to unlock:</p>
          <ul className="space-y-1">
            {['Unlimited watchlist stocks', 'Price alerts via email', 'CSV export', 'API access (Enterprise)'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleUpgrade('pro')}
              disabled={upgrading !== null}
              className="flex-1"
            >
              {upgrading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro — $29/mo'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpgrade('enterprise')}
              disabled={upgrading !== null}
              className="flex-1"
            >
              {upgrading === 'enterprise' ? 'Redirecting...' : 'Enterprise — $99/mo'}
            </Button>
          </div>
        </div>
      )}

      {hasPaidPlan && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleBillingPortal}
          disabled={portalLoading}
        >
          {portalLoading ? 'Loading...' : 'Manage Billing'}
        </Button>
      )}
    </div>
  )
}
