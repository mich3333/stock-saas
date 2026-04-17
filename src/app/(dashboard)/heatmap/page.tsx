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
        color: '#787b86',
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
        background: '#131722',
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #2a2e39',
          background: '#1e222d',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <BarChart2 size={18} color="#2962ff" />
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#d1d4dc', margin: 0, lineHeight: 1.2 }}>
            Market Heatmap
          </h1>
          <p style={{ fontSize: 11, color: '#787b86', margin: 0 }}>
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
