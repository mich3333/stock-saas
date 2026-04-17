'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useChartData, type Timeframe } from '@/hooks/useChartData'
import type { ChartPoint } from '@/types'

interface StockChartProps {
  data?: ChartPoint[]
  symbol: string
  isPositive?: boolean
}

type ChartMode = 'line' | 'candle'

const TIMEFRAMES: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y']
const DEFAULT_TIMEFRAME: Timeframe = '1M'

function toTimestamp(date: string): UTCTimestamp {
  return Math.floor(new Date(date).getTime() / 1000) as UTCTimestamp
}

function normalizeChartPoints(points: ChartPoint[]): ChartPoint[] {
  const byTime = new Map<number, ChartPoint>()

  for (const point of points) {
    const time = Number(toTimestamp(point.date))
    if (!Number.isFinite(time)) continue
    byTime.set(time, point)
  }

  return [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, point]) => point)
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return value.toFixed(0)
}

function formatTimeLabel(date: string, timeframe: Timeframe): string {
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return date

  if (timeframe === '1D' || timeframe === '5D') {
    return value.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function StockChart({ data: externalData, symbol, isPositive }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME)
  const [chartMode, setChartMode] = useState<ChartMode>('candle')
  const [hasChangedTimeframe, setHasChangedTimeframe] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const { data: fetchedData, loading, error } = useChartData(
    hasChangedTimeframe || !externalData ? symbol : '',
    timeframe
  )

  const rawData = useMemo(
    () => normalizeChartPoints(hasChangedTimeframe || !externalData ? fetchedData : (externalData ?? [])),
    [externalData, fetchedData, hasChangedTimeframe]
  )
  const hasData = rawData.length > 0
  const hasCandleData = rawData.some((point) => point.open != null && point.high != null && point.low != null)
  const accentColor = isPositive === false ? '#ef4444' : '#16a34a'

  useEffect(() => {
    if (!hasCandleData && chartMode === 'candle') {
      setChartMode('line')
    }
  }, [chartMode, hasCandleData])

  const latestPoint = rawData[rawData.length - 1]
  const firstPoint = rawData[0]
  const periodChange = latestPoint && firstPoint ? latestPoint.close - firstPoint.close : 0
  const periodChangePct = firstPoint?.close ? (periodChange / firstPoint.close) * 100 : 0
  const isPeriodPositive = periodChange >= 0

  const lineData = useMemo(
    () => rawData.map((point) => ({ time: toTimestamp(point.date), value: point.close })),
    [rawData]
  )

  const candleData = useMemo(
    () =>
      rawData.map((point) => ({
        time: toTimestamp(point.date),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    [rawData]
  )

  const volumeData = useMemo(
    () =>
      rawData.map((point) => ({
        time: toTimestamp(point.date),
        value: point.volume,
        color: point.close >= point.open ? 'rgba(22, 163, 74, 0.45)' : 'rgba(239, 68, 68, 0.45)',
      })),
    [rawData]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'var(--text-secondary)',
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.12)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.12)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
        timeVisible: timeframe === '1D' || timeframe === '5D',
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      },
      localization: {
        locale: 'en-US',
      },
    })

    chartRef.current = chart

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeRef.current = null
    }
  }, [timeframe])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current)
      seriesRef.current = null
    }

    if (chartMode === 'candle' && hasCandleData) {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#16a34a',
        wickDownColor: '#ef4444',
        priceLineColor: accentColor,
        lastValueVisible: true,
      })
      candleSeries.setData(candleData)
      seriesRef.current = candleSeries
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: accentColor,
        lineWidth: 2,
        priceLineColor: accentColor,
        lastValueVisible: true,
        crosshairMarkerRadius: 4,
      })
      lineSeries.setData(lineData)
      seriesRef.current = lineSeries
    }

    if (!volumeRef.current) {
      volumeRef.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })
      volumeRef.current.priceScale().applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      })
    }

    volumeRef.current.setData(volumeData)

    chart.timeScale().fitContent()
  }, [accentColor, candleData, chartMode, hasCandleData, lineData, volumeData])

  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value)
    setHasChangedTimeframe(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-bold tracking-wide text-[var(--foreground)]">{symbol}</h3>
            {latestPoint && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: isPeriodPositive ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'rgba(239, 68, 68, 0.12)',
                  color: isPeriodPositive ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${isPeriodPositive ? 'color-mix(in srgb, var(--green) 28%, transparent)' : 'rgba(239, 68, 68, 0.28)'}`,
                }}
              >
                ${latestPoint.close.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[var(--foreground)]">
              {latestPoint ? `$${latestPoint.close.toFixed(2)}` : 'No data'}
            </span>
            {hasData && (
              <span style={{ color: isPeriodPositive ? 'var(--green)' : 'var(--red)' }}>
                {isPeriodPositive ? '+' : ''}
                {periodChange.toFixed(2)} ({isPeriodPositive ? '+' : ''}
                {periodChangePct.toFixed(2)}%)
              </span>
            )}
          </div>
          {latestPoint && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Volume {formatVolume(latestPoint.volume)} · Last update {formatTimeLabel(latestPoint.date, timeframe)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panel)]">
            {TIMEFRAMES.map((value) => (
              <button
                key={value}
                onClick={() => handleTimeframeChange(value)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: timeframe === value ? 'var(--accent)' : 'transparent',
                  color: timeframe === value ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {value}
              </button>
            ))}
          </div>

          {hasCandleData && (
            <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--panel)]">
              {(['line', 'candle'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                  style={{
                    background: chartMode === mode ? 'var(--foreground)' : 'transparent',
                    color: chartMode === mode ? 'var(--background)' : 'var(--text-secondary)',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && !hasData && (
        <div className="text-xs text-center py-3 mb-3 rounded-xl border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] text-[var(--red)]">
          Failed to load chart data: {error}
        </div>
      )}

      <div className="relative rounded-[1.25rem] border border-[var(--border)] bg-[color:var(--background)]/70 overflow-hidden">
        {(loading || !hasData) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color:var(--panel-strong)]/80 backdrop-blur-sm">
            <span className="text-sm text-[var(--text-secondary)]">
              {loading ? 'Loading chart data...' : 'No chart data available'}
            </span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-[420px]" />
      </div>

      <div className="mt-3 flex justify-end">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] transition-opacity hover:opacity-100 opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          Chart technology by TradingView
        </a>
      </div>
    </motion.div>
  )
}
