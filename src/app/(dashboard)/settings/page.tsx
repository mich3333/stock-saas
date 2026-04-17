'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SubscriptionStatus } from '@/components/subscription/subscription-status'
import { PriceAlerts } from '@/components/alerts/price-alerts'
import { User } from 'lucide-react'

const TV = {
  bg:     '#131722',
  panel:  '#1e222d',
  border: '#2a2e39',
  text:   '#d1d4dc',
  muted:  '#787b86',
  accent: '#2962ff',
} as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: TV.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: TV.panel, border: `1px solid ${TV.border}`, borderRadius: 6, padding: '16px 18px' }}>
      {children}
    </div>
  )
}

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
      setSaveMessage('Saved')
    }
    setSaving(false)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: TV.text, margin: '0 0 20px' }}>Settings</h1>

      {/* Profile */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Profile</SectionLabel>
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(41,98,255,0.18)',
              border: '1px solid rgba(41,98,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={18} style={{ color: TV.accent }} />
            </div>
            <div>
              {userName && <div style={{ fontSize: 13, fontWeight: 600, color: TV.text }}>{userName}</div>}
              <div style={{ fontSize: 12, color: TV.muted }}>{userEmail ?? '…'}</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: TV.muted, marginBottom: 6 }}>Display Name</div>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                height: 32,
                padding: '0 10px',
                background: TV.bg,
                border: `1px solid ${TV.border}`,
                borderRadius: 4,
                color: TV.text,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = TV.accent }}
              onBlur={e => { e.currentTarget.style.borderColor = TV.border }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleUpdateProfile}
              disabled={saving || editName === (userName ?? '')}
              style={{
                height: 30,
                padding: '0 14px',
                background: saving || editName === (userName ?? '') ? TV.border : TV.accent,
                border: 'none',
                borderRadius: 4,
                color: saving || editName === (userName ?? '') ? TV.muted : '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: saving || editName === (userName ?? '') ? 'default' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saveMessage && (
              <span style={{ fontSize: 12, color: saveMessage === 'Saved' ? '#26a69a' : '#ef5350' }}>
                {saveMessage}
              </span>
            )}
          </div>
        </Panel>
      </div>

      {/* Subscription & Billing */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Subscription &amp; Billing</SectionLabel>
        <Suspense fallback={
          <div style={{ background: TV.panel, border: `1px solid ${TV.border}`, borderRadius: 6, height: 120 }} />
        }>
          <SubscriptionStatus />
        </Suspense>
      </div>

      {/* Price Alerts */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Price Alerts</SectionLabel>
        <PriceAlerts />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ background: '#131722', minHeight: '100%' }} />}>
      <SettingsPageContent />
    </Suspense>
  )
}
