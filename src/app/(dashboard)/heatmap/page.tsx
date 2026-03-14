'use client'

import dynamic from 'next/dynamic'
import { BarChart2 } from 'lucide-react'

const StockHeatmap = dynamic(() => import('@/components/heatmap/StockHeatmap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: 13,
      }}
    >
      Loading heatmap…
    </div>
  ),
})

export default function HeatmapPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--background)',
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel-strong)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <BarChart2 size={18} color="var(--accent)" />
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
            Market Heatmap
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
            S&amp;P 500 performance by sector — tile size = market cap, color = % change
          </p>
        </div>
      </div>

      {/* Full-height heatmap */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <StockHeatmap />
      </div>
    </div>
  )
}
