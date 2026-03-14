'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Trash2, Plus } from 'lucide-react'
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
    return <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse h-32" />
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <BellOff size={18} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Price Alerts</h3>
          <Badge>{alerts.filter(a => a.is_active).length} active</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} className="mr-1" />
          New Alert
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Symbol (e.g. AAPL)"
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              className="col-span-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={form.condition}
              onChange={e => setForm(f => ({ ...f, condition: e.target.value as 'above' | 'below' }))}
              className="col-span-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="above">Goes above</option>
              <option value="below">Goes below</option>
            </select>
            <input
              type="number"
              placeholder="Target price"
              value={form.target_price}
              onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
              step="0.01"
              min="0"
              className="col-span-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? 'Creating...' : 'Create Alert'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No price alerts set up yet</p>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{alert.symbol}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {alert.condition === 'above' ? '>' : '<'} ${alert.target_price.toFixed(2)}
                </span>
                {alert.triggered_at ? (
                  <Badge variant="success">Triggered</Badge>
                ) : alert.is_active ? (
                  <Badge variant="info">Active</Badge>
                ) : (
                  <Badge>Inactive</Badge>
                )}
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
