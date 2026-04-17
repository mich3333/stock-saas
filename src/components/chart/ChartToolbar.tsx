'use client'

import React from 'react'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'] as const
export type ChartTimeframe = (typeof TIMEFRAMES)[number]

interface ChartToolbarProps {
  activeTimeframe: ChartTimeframe
  onTimeframeChange: (timeframe: ChartTimeframe) => void
}

export function ChartToolbar({ activeTimeframe, onTimeframeChange }: ChartToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf === activeTimeframe
        return (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            style={{
              background: isActive ? '#2962ff' : 'transparent',
              color: isActive ? '#ffffff' : '#d1d4dc',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(209, 212, 220, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }
            }}
          >
            {tf}
          </button>
        )
      })}
    </div>
  )
}
