'use client'

import type { AnalystForecast, OverallSignal } from '@/types/symbol'

const CONSENSUS_STYLE: Record<OverallSignal, { color: string; label: string }> = {
  strong_buy: { color: '#26a69a', label: 'Strong Buy' },
  buy: { color: '#26a69a', label: 'Buy' },
  neutral: { color: '#f59e0b', label: 'Hold' },
  sell: { color: '#ef5350', label: 'Sell' },
  strong_sell: { color: '#ef5350', label: 'Strong Sell' },
}

interface Props {
  forecast: AnalystForecast
  currentPrice: number
}

export function ForecastsTab({ forecast, currentPrice }: Props) {
  const consensus = CONSENSUS_STYLE[forecast.consensus]
  const total = forecast.strongBuy + forecast.buy + forecast.hold + forecast.sell + forecast.strongSell
  const upside = ((forecast.avgTarget - currentPrice) / currentPrice * 100).toFixed(1)
  const isUpside = parseFloat(upside) >= 0

  const ratings = [
    { label: 'Strong Buy', count: forecast.strongBuy, color: '#26a69a' },
    { label: 'Buy', count: forecast.buy, color: '#52c7b8' },
    { label: 'Hold', count: forecast.hold, color: '#f59e0b' },
    { label: 'Sell', count: forecast.sell, color: '#ff7043' },
    { label: 'Strong Sell', count: forecast.strongSell, color: '#ef5350' },
  ]

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Analyst consensus */}
      <div
        className="rounded-lg border p-5"
        style={{ background: '#1e222d', borderColor: '#2a2e39' }}
      >
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#787b86' }}>
          Analyst Consensus · {total} analysts
        </h3>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Big consensus label */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="text-[28px] font-bold" style={{ color: consensus.color }}>{consensus.label}</div>
            <div className="text-[12px]" style={{ color: '#787b86' }}>{total} analyst ratings</div>
          </div>

          {/* Rating bars */}
          <div className="flex-1">
            {ratings.map(r => (
              <div key={r.label} className="flex items-center gap-3 mb-2">
                <span className="text-[11px] w-20 flex-shrink-0" style={{ color: '#787b86' }}>{r.label}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#2a2e39' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(r.count / total) * 100}%`, background: r.color }}
                  />
                </div>
                <span className="text-[11px] w-4 text-right tabular-nums" style={{ color: '#d1d4dc' }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price target */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TargetCard
          label="Average Target"
          value={`$${forecast.avgTarget.toFixed(2)}`}
          sub={`${isUpside ? '+' : ''}${upside}% from current`}
          color={isUpside ? '#26a69a' : '#ef5350'}
          highlight
        />
        <TargetCard
          label="High Target"
          value={`$${forecast.highTarget.toFixed(2)}`}
          sub={`+${((forecast.highTarget - currentPrice) / currentPrice * 100).toFixed(1)}% upside`}
          color="#26a69a"
        />
        <TargetCard
          label="Low Target"
          value={`$${forecast.lowTarget.toFixed(2)}`}
          sub={`${((forecast.lowTarget - currentPrice) / currentPrice * 100).toFixed(1)}% downside`}
          color="#ef5350"
        />
      </div>

      {/* Target range visualizer */}
      <div className="rounded-lg border p-4" style={{ background: '#1e222d', borderColor: '#2a2e39' }}>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: '#787b86' }}>
          Price Target Range
        </h3>
        {(() => {
          const low = forecast.lowTarget
          const high = forecast.highTarget
          const range = high - low
          const currentPct = ((currentPrice - low) / range) * 100
          const avgPct = ((forecast.avgTarget - low) / range) * 100
          return (
            <div className="relative">
              <div className="relative h-2 rounded-full mx-4" style={{ background: '#2a2e39' }}>
                <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(to right, #ef5350, #f59e0b, #26a69a)' }} />
                {/* Current price marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 z-10"
                  style={{ left: `${currentPct}%`, background: '#d1d4dc', borderColor: '#131722', transform: 'translate(-50%, -50%)' }}
                  title={`Current: $${currentPrice}`}
                />
                {/* Avg target marker */}
                <div
                  className="absolute top-1/2 w-3 h-3 rounded-full border-2 z-10"
                  style={{ left: `${avgPct}%`, background: '#2962ff', borderColor: '#131722', transform: 'translate(-50%, -50%)' }}
                  title={`Avg Target: $${forecast.avgTarget}`}
                />
              </div>
              <div className="flex justify-between mt-3 text-[11px]" style={{ color: '#787b86' }}>
                <span style={{ color: '#ef5350' }}>${low}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#d1d4dc' }} /> Current
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#2962ff' }} /> Avg Target
                  </span>
                </div>
                <span style={{ color: '#26a69a' }}>${high}</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Scenarios */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#787b86' }}>
          Price Scenarios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ScenarioCard
            label="Bull Case"
            emoji="🚀"
            target={forecast.scenarios.bull.target}
            rationale={forecast.scenarios.bull.rationale}
            color="#26a69a"
            currentPrice={currentPrice}
          />
          <ScenarioCard
            label="Base Case"
            emoji="📊"
            target={forecast.scenarios.base.target}
            rationale={forecast.scenarios.base.rationale}
            color="#2962ff"
            currentPrice={currentPrice}
          />
          <ScenarioCard
            label="Bear Case"
            emoji="🐻"
            target={forecast.scenarios.bear.target}
            rationale={forecast.scenarios.bear.rationale}
            color="#ef5350"
            currentPrice={currentPrice}
          />
        </div>
      </div>
    </div>
  )
}

function TargetCard({ label, value, sub, color, highlight }: {
  label: string; value: string; sub: string; color: string; highlight?: boolean
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: highlight ? 'rgba(41,98,255,0.07)' : '#1e222d',
        borderColor: highlight ? '#2962ff44' : '#2a2e39',
      }}
    >
      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: '#787b86' }}>{label}</div>
      <div className="text-[20px] font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color }}>{sub}</div>
    </div>
  )
}

function ScenarioCard({ label, emoji, target, rationale, color, currentPrice }: {
  label: string; emoji: string; target: number; rationale: string; color: string; currentPrice: number
}) {
  const pct = ((target - currentPrice) / currentPrice * 100).toFixed(1)
  return (
    <div className="rounded-lg border p-4" style={{ background: '#1e222d', borderColor: '#2a2e39' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[16px]">{emoji}</span>
        <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="text-[20px] font-bold tabular-nums mb-0.5" style={{ color }}>${target}</div>
      <div className="text-[11px] mb-3" style={{ color }}>
        {parseFloat(pct) >= 0 ? '+' : ''}{pct}% from current
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: '#787b86' }}>{rationale}</p>
    </div>
  )
}
