'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Plus, X, Trash2, ChevronDown } from 'lucide-react'

type AlertStatus = 'active' | 'triggered' | 'expired'
type Condition = 'crosses above' | 'crosses below' | '% change above' | '% change below'

interface Alert {
  id: string
  symbol: string
  name: string
  condition: Condition
  price: number
  status: AlertStatus
  createdAt: string
}

const MOCK_ALERTS: Alert[] = [
  { id: '1', symbol: 'AAPL', name: 'AAPL breakout', condition: 'crosses above', price: 200, status: 'active', createdAt: '2h ago' },
  { id: '2', symbol: 'BTC-USD', name: 'BTC correction', condition: 'crosses below', price: 60000, status: 'active', createdAt: '5h ago' },
  { id: '3', symbol: 'NVDA', name: 'NVDA ATH', condition: 'crosses above', price: 950, status: 'triggered', createdAt: '1d ago' },
  { id: '4', symbol: 'TSLA', name: 'TSLA support', condition: 'crosses below', price: 220, status: 'expired', createdAt: '3d ago' },
  { id: '5', symbol: 'SPY', name: 'SPY dip', condition: 'crosses below', price: 510, status: 'active', createdAt: '1h ago' },
  { id: '6', symbol: 'MSFT', name: 'MSFT earnings', condition: 'crosses above', price: 420, status: 'triggered', createdAt: '2d ago' },
]

const TABS: { label: string; value: 'all' | AlertStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Triggered', value: 'triggered' },
  { label: 'Expired', value: 'expired' },
]

const CONDITIONS: Condition[] = ['crosses above', 'crosses below', '% change above', '% change below']

const STATUS_CONFIG: Record<AlertStatus, { color: string; label: string }> = {
  active: { color: '#26a69a', label: 'Active' },
  triggered: { color: '#2962ff', label: 'Triggered' },
  expired: { color: '#787b86', label: 'Expired' },
}

function formatPrice(price: number): string {
  return price >= 1000
    ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toFixed(2)
}

export default function AlertsPage() {
  const searchParams = useSearchParams()
  const requestedSymbol = searchParams.get('symbol')?.trim().toUpperCase() ?? ''
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [activeTab, setActiveTab] = useState<'all' | AlertStatus>('all')
  const [showForm, setShowForm] = useState(true)
  const [formSymbol, setFormSymbol] = useState(requestedSymbol)
  const [formCondition, setFormCondition] = useState<Condition>('crosses above')
  const [formPrice, setFormPrice] = useState('')
  const [formName, setFormName] = useState(requestedSymbol ? `${requestedSymbol} alert` : '')

  const filtered = activeTab === 'all' ? alerts : alerts.filter(a => a.status === activeTab)

  function handleDelete(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  function handleCreate() {
    if (!formSymbol.trim() || !formPrice.trim()) return
    const price = parseFloat(formPrice)
    if (!isFinite(price) || price <= 0) return

    const symbol = formSymbol.trim().toUpperCase()
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol,
      name: formName.trim() || `${symbol} alert`,
      condition: formCondition,
      price,
      status: 'active',
      createdAt: 'Just now',
    }
    setAlerts(prev => [newAlert, ...prev])
    setFormSymbol('')
    setFormPrice('')
    setFormName('')
    setFormCondition('crosses above')
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#131722' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: '#2a2e39' }}
      >
        <div className="flex items-center gap-2.5">
          <Bell size={18} style={{ color: '#d1d4dc' }} />
          <h1 className="text-[15px] font-semibold" style={{ color: '#d1d4dc' }}>
            Alerts
          </h1>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: '#2a2e39', color: '#787b86' }}
          >
            {alerts.filter(a => a.status === 'active').length} active
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors hover:brightness-110"
          style={{ background: '#2962ff', color: '#fff' }}
        >
          <Plus size={14} />
          New Alert
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-0 px-6 border-b"
        style={{ borderColor: '#2a2e39' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="px-4 py-2.5 text-[12px] font-medium transition-colors"
              style={{
                color: isActive ? '#d1d4dc' : '#787b86',
                borderBottom: isActive ? '2px solid #2962ff' : '2px solid transparent',
              }}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1.5" style={{ color: '#787b86' }}>
                  {alerts.filter(a => tab.value === 'all' || a.status === tab.value).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main content: list + form */}
      <div className="flex flex-1 overflow-hidden">
        {/* Alert list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Bell size={32} style={{ color: '#787b86' }} />
              <p className="text-[13px]" style={{ color: '#787b86' }}>
                No {activeTab === 'all' ? '' : activeTab} alerts
              </p>
            </div>
          ) : (
            <div>
              {filtered.map(alert => {
                const statusCfg = STATUS_CONFIG[alert.status]
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between px-6 py-3 border-b transition-colors hover:brightness-110"
                    style={{ borderColor: '#2a2e39', background: '#1e222d' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#262a35' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1e222d' }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold shrink-0"
                        style={{ background: '#2a2e39', color: '#d1d4dc' }}
                      >
                        {alert.symbol}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ color: '#d1d4dc' }}>
                          {alert.name}
                        </div>
                        <div className="text-[11px]" style={{ color: '#787b86' }}>
                          Price {alert.condition} ${formatPrice(alert.price)} &middot; {alert.createdAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: statusCfg.color }}
                        />
                        <span className="text-[11px] font-medium" style={{ color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <span className="text-[13px] font-mono" style={{ color: '#d1d4dc' }}>
                        ${formatPrice(alert.price)}
                      </span>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#787b86' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef5350' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#787b86' }}
                        title="Delete alert"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create alert form (right panel) */}
        {showForm && (
          <div
            className="w-[340px] shrink-0 border-l overflow-y-auto"
            style={{ borderColor: '#2a2e39', background: '#1e222d' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2a2e39' }}>
              <span className="text-[13px] font-semibold" style={{ color: '#d1d4dc' }}>
                Create Alert
              </span>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded transition-colors"
                style={{ color: '#787b86' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#d1d4dc' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#787b86' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#787b86' }}>
                  Symbol
                </label>
                <input
                  type="text"
                  value={formSymbol}
                  onChange={e => setFormSymbol(e.target.value)}
                  placeholder="e.g. AAPL"
                  className="w-full px-3 py-2 rounded text-[13px] outline-none transition-colors"
                  style={{
                    background: '#131722',
                    border: '1px solid #2a2e39',
                    color: '#d1d4dc',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2962ff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2a2e39' }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#787b86' }}>
                  Condition
                </label>
                <div className="relative">
                  <select
                    value={formCondition}
                    onChange={e => setFormCondition(e.target.value as Condition)}
                    className="w-full px-3 py-2 rounded text-[13px] outline-none appearance-none transition-colors"
                    style={{
                      background: '#131722',
                      border: '1px solid #2a2e39',
                      color: '#d1d4dc',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2962ff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#2a2e39' }}
                  >
                    {CONDITIONS.map(c => (
                      <option key={c} value={c}>Price {c}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#787b86' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#787b86' }}>
                  Price
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]"
                    style={{ color: '#787b86' }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 rounded text-[13px] outline-none transition-colors"
                    style={{
                      background: '#131722',
                      border: '1px solid #2a2e39',
                      color: '#d1d4dc',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2962ff' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#2a2e39' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#787b86' }}>
                  Name <span style={{ color: '#787b86' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. AAPL breakout"
                  className="w-full px-3 py-2 rounded text-[13px] outline-none transition-colors"
                  style={{
                    background: '#131722',
                    border: '1px solid #2a2e39',
                    color: '#d1d4dc',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2962ff' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2a2e39' }}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!formSymbol.trim() || !formPrice.trim()}
                className="w-full py-2.5 rounded text-[13px] font-medium transition-colors mt-2"
                style={{
                  background: formSymbol.trim() && formPrice.trim() ? '#2962ff' : '#2a2e39',
                  color: formSymbol.trim() && formPrice.trim() ? '#fff' : '#787b86',
                  cursor: formSymbol.trim() && formPrice.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create Alert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
