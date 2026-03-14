'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import type { Alert } from '@/types'

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ symbol: '', condition: 'above' as 'above' | 'below', target_price: '' })
  const [showForm, setShowForm] = useState(false)

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.status === 403) {
        setError('Upgrade to Pro to use price alerts')
        return
      }
      const { data } = await res.json()
      setAlerts(data ?? [])
    } catch {
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.symbol || !form.target_price) return
    setCreating(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: form.symbol,
          condition: form.condition,
          target_price: parseFloat(form.target_price),
        }),
      })
      const { data, error: err } = await res.json()
      if (err) throw new Error(err)
      if (data) {
        setAlerts(prev => [data, ...prev])
        setForm({ symbol: '', condition: 'above', target_price: '' })
        setShowForm(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch {
      setError('Failed to delete alert')
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', minHeight: 128 }}
      />
    )
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(239,83,80,0.12)' }}
          >
            <BellOff size={15} style={{ color: 'var(--red)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    )
  }

  const activeCount = alerts.filter(a => a.is_active).length

  return (
    <div
      className="rounded-xl"
      style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
          >
            <Bell size={13} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Price Alerts</span>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}
            >
              {activeCount} active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={12} />
          New Alert
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}
        >
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Symbol"
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              className="col-span-1 px-2.5 py-1.5 text-xs rounded-lg"
              style={{
                background: 'var(--panel-strong)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
              required
            />
            <select
              value={form.condition}
              onChange={e => setForm(f => ({ ...f, condition: e.target.value as 'above' | 'below' }))}
              className="col-span-1 px-2.5 py-1.5 text-xs rounded-lg"
              style={{
                background: 'var(--panel-strong)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
            >
              <option value="above">Goes above</option>
              <option value="below">Goes below</option>
            </select>
            <input
              type="number"
              placeholder="Target $"
              value={form.target_price}
              onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
              step="0.01"
              min="0"
              className="col-span-1 px-2.5 py-1.5 text-xs rounded-lg"
              style={{
                background: 'var(--panel-strong)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
              }}
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {creating ? 'Creating...' : 'Create Alert'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Alerts list / empty state */}
      {alerts.length === 0 ? (
        <div className="py-12 text-center px-6">
          <div
            className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: 'rgba(41,98,255,0.12)', border: '1px solid rgba(41,98,255,0.2)' }}
          >
            <Bell size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No price alerts yet</p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Get notified instantly when a stock hits your target price.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={13} />
            Create your first alert
          </button>
        </div>
      ) : (
        <div className="py-1">
          {alerts.map(alert => {
            const isAbove = alert.condition === 'above'
            const isTriggered = !!alert.triggered_at

            let statusLabel = 'Inactive'
            let statusBg = 'rgba(120,123,134,0.15)'
            let statusColor = '#787B86'
            if (isTriggered) {
              statusLabel = 'Triggered'
              statusBg = 'rgba(246,189,65,0.15)'
              statusColor = '#F6BD41'
            } else if (alert.is_active) {
              statusLabel = 'Active'
              statusBg = 'color-mix(in srgb, var(--green) 15%, transparent)'
              statusColor = 'var(--green)'
            }

            return (
              <div
                key={alert.id}
                className="group flex items-center justify-between px-4 py-2.5 transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                    style={{ background: isAbove ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'rgba(239,83,80,0.12)' }}
                  >
                    {isAbove
                      ? <TrendingUp size={13} style={{ color: 'var(--green)' }} />
                      : <TrendingDown size={13} style={{ color: 'var(--red)' }} />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{alert.symbol}</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {isAbove ? '>' : '<'} ${alert.target_price.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: statusBg, color: statusColor }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--red)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,83,80,0.12)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
