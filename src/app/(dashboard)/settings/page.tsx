'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SubscriptionStatus } from '@/components/subscription/subscription-status'
import { PriceAlerts } from '@/components/alerts/price-alerts'
import { Button } from '@/components/ui/button'
import { Settings, User } from 'lucide-react'

function SettingsPageContent() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email ?? null)
      const name = session.user.user_metadata?.full_name ?? null
      setUserName(name)
      setEditName(name ?? '')
    }
    checkAuth()
  }, [router])

  const handleUpdateProfile = async () => {
    setSaving(true)
    setSaveMessage(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: editName },
    })
    if (error) {
      setSaveMessage(error.message)
    } else {
      setUserName(editName)
      setSaveMessage('Profile updated')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={22} className="text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        </div>

        {/* Profile section */}
        <section>
          <h2
            className="section-kicker text-xs font-semibold uppercase tracking-wider mb-3"
          >
            Profile
          </h2>
          <div
            className="glass-panel-strong rounded-[1.75rem] p-6"
          >
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
              >
                <User size={22} className="text-[var(--accent)]" />
              </div>
              <div>
                {userName && (
                  <p className="font-semibold text-[var(--foreground)]">{userName}</p>
                )}
                <p className="text-sm text-[var(--text-secondary)]">{userEmail ?? '...'}</p>
              </div>
            </div>

            {/* Edit name */}
            <div className="space-y-3">
              <div>
                <label
                  className="section-kicker block text-xs font-medium mb-1 uppercase tracking-wider"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  className="auth-input text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleUpdateProfile}
                  loading={saving}
                  disabled={saving || editName === (userName ?? '')}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saveMessage && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: saveMessage === 'Profile updated' ? 'var(--green)' : 'var(--red)' }}
                  >
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription / Billing section */}
        <section>
          <h2
            className="section-kicker text-xs font-semibold uppercase tracking-wider mb-3"
          >
            Subscription &amp; Billing
          </h2>
          <Suspense fallback={<div className="glass-panel-strong rounded-[1.75rem] p-6 animate-pulse h-72" />}>
            <SubscriptionStatus />
          </Suspense>
        </section>

        {/* Price Alerts section */}
        <section>
          <h2
            className="section-kicker text-xs font-semibold uppercase tracking-wider mb-3"
          >
            Price Alerts
          </h2>
          <PriceAlerts />
        </section>
      </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="app-shell min-h-screen" />}>
      <SettingsPageContent />
    </Suspense>
  )
}
