'use client'

import type { TechnicalSummary, Signal, OverallSignal } from '@/types/symbol'

const SIGNAL_STYLE: Record<Signal, { color: string; bg: string; label: string }> = {
  buy: { color: '#26a69a', bg: 'rgba(38,166,154,0.12)', label: 'Buy' },
  sell: { color: '#ef5350', bg: 'rgba(239,83,80,0.12)', label: 'Sell' },
  neutral: { color: '#787b86', bg: 'rgba(120,123,134,0.12)', label: 'Neutral' },
}

const OVERALL_SIGNAL_STYLE: Record<OverallSignal, { color: string; label: string; score: string }> = {
  strong_buy: { color: '#26a69a', label: 'Strong Buy', score: 'Bullish' },
  buy: { color: '#26a69a', label: 'Buy', score: 'Bullish' },
  neutral: { color: '#f59e0b', label: 'Neutral', score: 'Mixed' },
  sell: { color: '#ef5350', label: 'Sell', score: 'Bearish' },
  strong_sell: { color: '#ef5350', label: 'Strong Sell', score: 'Bearish' },
}

interface Props {
  technicals: TechnicalSummary
  currentPrice: number
}

export function TechnicalsTab({ technicals, currentPrice }: Props) {
  const overall = OVERALL_SIGNAL_STYLE[technicals.overallSignal]
  const totalSignals = technicals.maBuyCount + technicals.maSellCount + technicals.maNeutralCount +
    technicals.oscBuyCount + technicals.oscSellCount + technicals.oscNeutralCount
  const buyTotal = technicals.maBuyCount + technicals.oscBuyCount
  const sellTotal = technicals.maSellCount + technicals.oscSellCount

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Overall gauge */}
      <div
        className="rounded-lg border p-5 flex flex-col sm:flex-row items-center gap-5"
        style={{ background: '#1e222d', borderColor: '#2a2e39' }}
      >
        {/* Gauge circle */}
        <div className="flex-shrink-0 relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#2a2e39" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="38" fill="none"
              stroke={overall.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(((technicals.overallScore + 100) / 200) * 238).toFixed(1)} 238`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-bold" style={{ color: overall.color }}>
              {technicals.overallScore > 0 ? '+' : ''}{technicals.overallScore}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#787b86' }}>Overall Signal</div>
          <div className="text-[22px] font-bold mb-1" style={{ color: overall.color }}>{overall.label}</div>
          <div className="text-[12px]" style={{ color: '#787b86' }}>
            Based on {totalSignals} indicators — {buyTotal} buy, {sellTotal} sell, {totalSignals - buyTotal - sellTotal} neutral
          </div>
        </div>

        {/* Counts */}
        <div className="flex gap-4 sm:gap-6">
          <CountBox label="Buy" count={buyTotal} color="#26a69a" />
          <CountBox label="Neutral" count={totalSignals - buyTotal - sellTotal} color="#787b86" />
          <CountBox label="Sell" count={sellTotal} color="#ef5350" />
        </div>
      </div>

      {/* Moving averages */}
      <SignalTable
        title="Moving Averages"
        signals={technicals.movingAverages}
        buyCount={technicals.maBuyCount}
        sellCount={technicals.maSellCount}
        neutralCount={technicals.maNeutralCount}
        currentPrice={currentPrice}
      />

      {/* Oscillators */}
      <SignalTable
        title="Oscillators"
        signals={technicals.oscillators}
        buyCount={technicals.oscBuyCount}
        sellCount={technicals.oscSellCount}
        neutralCount={technicals.oscNeutralCount}
        currentPrice={currentPrice}
      />

      {/* Support & Resistance */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#787b86' }}>
          Support & Resistance Zones
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <ZoneList label="Resistance" levels={technicals.resistance} color="#ef5350" />
          <ZoneList label="Support" levels={technicals.support} color="#26a69a" />
        </div>
      </div>

      {/* Trend summary */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#787b86' }}>
          Trend Summary
        </h3>
        <div
          className="rounded-lg p-4 text-[13px] leading-relaxed border-l-2"
          style={{ background: '#1e222d', color: '#9598a1', borderLeftColor: overall.color }}
        >
          {technicals.trendSummary}
        </div>
      </div>
    </div>
  )
}

function CountBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[20px] font-bold tabular-nums" style={{ color }}>{count}</span>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: '#787b86' }}>{label}</span>
    </div>
  )
}

function SignalTable({
  title, signals, buyCount, sellCount, neutralCount, currentPrice,
}: {
  title: string
  signals: { name: string; value: string; signal: Signal }[]
  buyCount: number
  sellCount: number
  neutralCount: number
  currentPrice: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#787b86' }}>
          {title}
        </h3>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: '#787b86' }}>
          <span style={{ color: '#26a69a' }}>{buyCount} Buy</span>
          <span>{neutralCount} Neutral</span>
          <span style={{ color: '#ef5350' }}>{sellCount} Sell</span>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#2a2e39' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#1a1e2b' }}>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wide font-medium" style={{ color: '#787b86' }}>Indicator</th>
              <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wide font-medium" style={{ color: '#787b86' }}>Value</th>
              <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wide font-medium" style={{ color: '#787b86' }}>vs Price</th>
              <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wide font-medium" style={{ color: '#787b86' }}>Signal</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => {
              const style = SIGNAL_STYLE[s.signal]
              const numVal = parseFloat(s.value)
              const diff = !isNaN(numVal) ? ((currentPrice - numVal) / numVal * 100).toFixed(2) : null
              return (
                <tr
                  key={s.name}
                  className="border-t"
                  style={{ borderColor: '#2a2e39', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                >
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: '#d1d4dc' }}>{s.name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-right tabular-nums" style={{ color: '#9598a1' }}>{s.value}</td>
                  <td className="px-4 py-2.5 text-[11px] text-right tabular-nums" style={{ color: diff && parseFloat(diff) > 0 ? '#26a69a' : '#ef5350' }}>
                    {diff ? `${parseFloat(diff) > 0 ? '+' : ''}${diff}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {style.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ZoneList({ label, levels, color }: { label: string; levels: number[]; color: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: '#1e222d', borderColor: '#2a2e39' }}>
      <div className="text-[10px] uppercase tracking-wide mb-2 font-medium" style={{ color }}>{label}</div>
      {levels.map((level, i) => (
        <div
          key={i}
          className="flex items-center gap-2 py-1.5 border-t"
          style={{ borderColor: '#2a2e39' }}
        >
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-[13px] tabular-nums font-medium" style={{ color: '#d1d4dc' }}>
            ${level.toFixed(2)}
          </span>
          <span className="text-[10px] ml-auto" style={{ color: '#787b86' }}>
            Zone {i + 1}
          </span>
        </div>
      ))}
    </div>
  )
}
