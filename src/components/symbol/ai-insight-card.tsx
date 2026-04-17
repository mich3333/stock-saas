'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react'
import type { AIInsight } from '@/types/symbol'

const CONFIDENCE_COLORS = {
  high: { dot: '#26a69a', label: 'High confidence' },
  medium: { dot: '#f59e0b', label: 'Medium confidence' },
  low: { dot: '#ef5350', label: 'Low confidence' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

interface Props {
  insight: AIInsight
  symbol: string
}

export function AIInsightCard({ insight, symbol }: Props) {
  const [expanded, setExpanded] = useState(false)
  const conf = CONFIDENCE_COLORS[insight.confidence]

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: '#1a1f2e', borderColor: '#2962ff33' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md mt-0.5"
            style={{ background: 'rgba(41,98,255,0.15)' }}
          >
            <Sparkles size={13} style={{ color: '#2962ff' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#2962ff' }}>
                StockFlow AI · {symbol}
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: '#787b86' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: conf.dot }} />
                {conf.label}
              </span>
            </div>
            <p className="text-[13px] font-medium leading-snug" style={{ color: '#d1d4dc' }}>
              {insight.headline}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors"
          style={{ color: '#787b86', background: '#2a2e39' }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 py-4 grid gap-4 sm:grid-cols-2" style={{ borderColor: '#2962ff22' }}>
          <InsightBlock icon="📅" label="What changed today" text={insight.whatChanged} />
          <InsightBlock icon="📈" label="Why it's moving" text={insight.whyMoving} />
          <InsightBlock icon="⚠️" label="Risk snapshot" text={insight.riskSnapshot} />
          <InsightBlock icon="💡" label="Key takeaway" text={insight.keyTakeaway} highlight />
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center gap-1.5 px-4 py-2 border-t text-[10px]"
        style={{ borderColor: '#2962ff22', color: '#787b86' }}
      >
        <Clock size={10} />
        Updated <span suppressHydrationWarning>{timeAgo(insight.updatedAt)}</span>
        <span className="ml-auto flex items-center gap-1">
          <AlertTriangle size={10} />
          Not financial advice
        </span>
      </div>
    </div>
  )
}

function InsightBlock({ icon, label, text, highlight }: { icon: string; label: string; text: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-md p-3"
      style={{ background: highlight ? 'rgba(41,98,255,0.07)' : 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px]">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#787b86' }}>
          {label}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: '#b0b3bc' }}>
        {text}
      </p>
    </div>
  )
}
