'use client'

import React, { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { type UTCTimestamp, type ISeriesApi } from 'lightweight-charts'
import { ChartToolbar, type ChartTimeframe } from './ChartToolbar'
import { useCandlestickChart, DEFAULT_THEME, type OHLCVBar } from './useCandlestickChart'
import { useMarketData } from '@/hooks/useMarketData'
import type { Timeframe } from '@/types/market'

// Map ChartTimeframe ('1D','1W') → Timeframe ('1d','1w')
const TIMEFRAME_MAP: Record<ChartTimeframe, Timeframe> = {
  '1m':  '1m',
  '5m':  '5m',
  '15m': '15m',
  '1h':  '1h',
  '4h':  '4h',
  '1D':  '1d',
  '1W':  '1w',
}

export interface ChartContainerHandle {
  updateBar: (bar: OHLCVBar) => void
  resetData: (bars: OHLCVBar[]) => void
  getSeries: () => ISeriesApi<'Candlestick'> | null
}

interface ChartContainerProps {
  symbol: string
  timeframe: ChartTimeframe
  onTimeframeChange: (timeframe: ChartTimeframe) => void
}

const ChartContainer = forwardRef<ChartContainerHandle, ChartContainerProps>(
  function ChartContainer({ symbol, timeframe, onTimeframeChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)

    const binanceTimeframe = TIMEFRAME_MAP[timeframe]
    const { data: rawData, latestBar, isConnected } = useMarketData(symbol, binanceTimeframe)

    // Convert OHLCV (time: number) → OHLCVBar (time: UTCTimestamp)
    const chartData: OHLCVBar[] = rawData.map((bar) => ({
      ...bar,
      time: bar.time as UTCTimestamp,
    }))

    const { series, updateBar, resetData } = useCandlestickChart({
      containerRef,
      data: chartData,
      theme: DEFAULT_THEME,
    })

    // Push live ticks into the chart
    useEffect(() => {
      if (!latestBar) return
      updateBar({ ...latestBar, time: latestBar.time as UTCTimestamp })
    }, [latestBar, updateBar])

    useImperativeHandle(
      ref,
      () => ({
        updateBar,
        resetData,
        getSeries: () => series,
      }),
      [updateBar, resetData, series]
    )

    const handleTimeframeChange = useCallback(
      (tf: ChartTimeframe) => {
        onTimeframeChange(tf)
      },
      [onTimeframeChange]
    )

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: DEFAULT_THEME.background,
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Toolbar row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px 0',
            borderBottom: '1px solid #2a2e39',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: DEFAULT_THEME.textColor,
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {symbol}
            </span>
            {/* Connection status dot */}
            <span
              title={isConnected ? 'Connected' : 'Disconnected'}
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#26a69a' : '#ef5350',
                flexShrink: 0,
              }}
            />
          </div>
          <ChartToolbar
            activeTimeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
          />
        </div>

        {/* Chart canvas */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '400px' }}
        />
      </div>
    )
  }
)

export { ChartContainer }
