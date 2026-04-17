'use client'
import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts'
import { PORTFOLIO_HOLDINGS, generatePortfolioHistory } from '@/lib/stockData'
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#2962FF',
  'Consumer Cyclical': '#f59e0b',
  Financials: '#8b5cf6',
  Healthcare: '#26a69a',
  Energy: '#f97316',
  'Communication Services': '#ec4899',
  Other: '#787B86',
}

const PIE_COLORS = ['#2962FF', '#26a69a', '#f59e0b', '#ef5350', '#8b5cf6', '#ec4899', '#06b6d4']

type Period = '1M' | '3M' | '6M' | '1Y'
const PERIOD_DAYS: Record<Period, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

export default function PortfolioPage() {
  const [period, setPeriod] = useState<Period>('6M')
  const allHistory = useMemo(() => generatePortfolioHistory(365), [])
  const history = useMemo(() => allHistory.slice(-PERIOD_DAYS[period]), [allHistory, period])

  const holdings = PORTFOLIO_HOLDINGS.map(h => ({
    ...h,
    value: h.currentPrice * h.shares,
    cost: h.avgCost * h.shares,
    pnl: (h.currentPrice - h.avgCost) * h.shares,
    pnlPct: ((h.currentPrice - h.avgCost) / h.avgCost) * 100,
  }))

  const totalValue = holdings.reduce((s, h) => s + h.value, 0)
  const totalCost = holdings.reduce((s, h) => s + h.cost, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = (totalPnl / totalCost) * 100

  // Sector allocation for pie
  const sectorMap: Record<string, number> = {}
  holdings.forEach(h => {
    sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + h.value
  })
  const pieData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }))

  const chartStart = history[0]?.value ?? 0
  const chartEnd = history[history.length - 1]?.value ?? 0
  const chartChange = chartEnd - chartStart
  const chartChangePct = chartStart > 0 ? (chartChange / chartStart) * 100 : 0
  const isChartPositive = chartChange >= 0
  const positiveColor = 'var(--green)'
  const negativeColor = 'var(--red)'
  const panelStyle = { background: 'var(--panel-strong)', border: '1px solid var(--border)' }
  const mutedTextStyle = { color: 'var(--text-secondary)' }
  const strongTextStyle = { color: 'var(--foreground)' }

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--background)' }}>
      <h1 className="text-xl font-bold mb-6" style={strongTextStyle}>Portfolio</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Value', value: formatCurrency(totalValue), sub: '', positive: true },
          { label: 'Total P&L', value: formatCurrency(totalPnl), sub: formatPercent(totalPnlPct), positive: totalPnl >= 0 },
          { label: 'Today\'s Change', value: formatCurrency(totalValue * 0.0043), sub: '+0.43%', positive: true },
          { label: 'Positions', value: String(holdings.length), sub: 'active', positive: true },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-lg p-4"
            style={panelStyle}
          >
            <p className="text-xs mb-1" style={mutedTextStyle}>{card.label}</p>
            <p className="text-xl font-bold" style={strongTextStyle}>{card.value}</p>
            {card.sub && (
              <p className="text-xs font-medium mt-0.5" style={{ color: card.positive ? positiveColor : negativeColor }}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Pie row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Area chart */}
        <div
          className="lg:col-span-2 rounded-lg p-4"
          style={panelStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={strongTextStyle}>Portfolio Value</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-lg font-bold" style={strongTextStyle}>{formatCurrency(chartEnd)}</p>
                <span
                  className="text-xs font-medium flex items-center gap-0.5"
                  style={{ color: isChartPositive ? positiveColor : negativeColor }}
                >
                  {isChartPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {formatPercent(chartChangePct)}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              {(['1M', '3M', '6M', '1Y'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-2.5 py-1 text-xs rounded font-medium transition-colors"
                  style={{
                    background: period === p ? 'var(--accent)' : 'var(--panel-muted)',
                    color: period === p ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isChartPositive ? '#26a69a' : '#ef5350'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isChartPositive ? '#26a69a' : '#ef5350'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                tickFormatter={v => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                tickFormatter={v => `$${formatLargeNumber(v)}`}
                width={55}
              />
              <Tooltip
                contentStyle={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(v: number | undefined) => [formatCurrency(v ?? 0), 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isChartPositive ? positiveColor : negativeColor}
                strokeWidth={2}
                fill="url(#portfolioGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div
          className="rounded-lg p-4"
          style={panelStyle}
        >
          <p className="text-sm font-semibold mb-3" style={strongTextStyle}>Allocation</p>
          <ResponsiveContainer width="100%" height={150}>
            <RechartsPie>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                formatter={(v: number | undefined) => [formatCurrency(v ?? 0), '']}
              />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: SECTOR_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[10px]" style={mutedTextStyle}>{entry.name}</span>
                </div>
                <span className="text-[10px] font-medium" style={strongTextStyle}>
                  {((entry.value / totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div className="rounded-lg overflow-hidden" style={panelStyle}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={strongTextStyle}>Holdings</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Symbol', 'Company', 'Shares', 'Avg Cost', 'Current Price', 'Value', 'P&L', 'P&L %'].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left font-medium" style={mutedTextStyle}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr
                  key={h.symbol}
                  style={{ borderBottom: i < holdings.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3 font-bold" style={{ color: 'var(--accent)' }}>{h.symbol}</td>
                  <td className="px-4 py-3" style={strongTextStyle}>{h.company}</td>
                  <td className="px-4 py-3 tabular-nums" style={strongTextStyle}>{h.shares}</td>
                  <td className="px-4 py-3 tabular-nums" style={strongTextStyle}>{formatCurrency(h.avgCost)}</td>
                  <td className="px-4 py-3 tabular-nums" style={strongTextStyle}>{formatCurrency(h.currentPrice)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium" style={strongTextStyle}>{formatCurrency(h.value)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium" style={{ color: h.pnl >= 0 ? positiveColor : negativeColor }}>
                    {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium" style={{ color: h.pnlPct >= 0 ? positiveColor : negativeColor }}>
                    <span className="flex items-center gap-1">
                      {h.pnlPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {formatPercent(h.pnlPct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
