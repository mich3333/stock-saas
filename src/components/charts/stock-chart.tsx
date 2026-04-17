'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useChartData, type Timeframe } from '@/hooks/useChartData'
import type { ChartPoint } from '@/types'

// ── TV Design Tokens (hardcoded) ──────────────────────────────────────
const TV = {
  bg: '#131722',
  panel: '#1e222d',
  border: '#2a2e39',
  text: '#d1d4dc',
  muted: '#787b86',
  green: '#26a69a',
  red: '#ef5350',
  accent: '#2962ff',
} as const

// ── Types ─────────────────────────────────────────────────────────────
interface StockChartProps {
  data?: ChartPoint[]
  symbol: string
  isPositive?: boolean
  fillHeight?: boolean
}

type ChartMode = 'area' | 'candle'

interface OHLCVInfo {
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ── Constants ─────────────────────────────────────────────────────────
const TIMEFRAMES: Timeframe[] = ['1M', '3M', '6M', '1Y', '2Y', '5Y']
const DEFAULT_TIMEFRAME: Timeframe = '1M'

// ── Helpers ───────────────────────────────────────────────────────────
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

function formatPrice(v: number): string {
  return v.toFixed(2)
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return value.toFixed(0)
}

// ── Component ─────────────────────────────────────────────────────────
export function StockChart({ data: externalData, symbol, fillHeight }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME)
  const [chartMode, setChartMode] = useState<ChartMode>('candle')
  const [hasChangedTimeframe, setHasChangedTimeframe] = useState(false)
  const [hoverInfo, setHoverInfo] = useState<OHLCVInfo | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const { data: fetchedData, loading } = useChartData(
    hasChangedTimeframe || !externalData ? symbol : '',
    timeframe
  )

  const rawData = useMemo(
    () => normalizeChartPoints(hasChangedTimeframe || !externalData ? fetchedData : (externalData ?? [])),
    [externalData, fetchedData, hasChangedTimeframe]
  )

  const hasData = rawData.length > 0
  const hasCandleData = rawData.some((p) => p.open != null && p.high != null && p.low != null)
  const effectiveChartMode: ChartMode = chartMode === 'candle' && !hasCandleData ? 'area' : chartMode

  const latestPoint = rawData[rawData.length - 1]
  const displayInfo: OHLCVInfo | null = hoverInfo ?? (latestPoint
    ? { open: latestPoint.open, high: latestPoint.high, low: latestPoint.low, close: latestPoint.close, volume: latestPoint.volume }
    : null)

  const resolvedSymbol = symbol.replace(/^\^/, '')

  // Compute change from displayed info
  const change = displayInfo && latestPoint ? displayInfo.close - (displayInfo === hoverInfo ? displayInfo.open : rawData[0]?.close ?? displayInfo.close) : 0
  const changePct = displayInfo ? (displayInfo.open ? (change / displayInfo.open) * 100 : 0) : 0
  const isUp = change >= 0

  const areaData = useMemo(
    () => rawData.map((p) => ({ time: toTimestamp(p.date), value: p.close })),
    [rawData]
  )

  const candleData = useMemo(
    () => rawData.map((p) => ({
      time: toTimestamp(p.date),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    })),
    [rawData]
  )

  const volumeData = useMemo(
    () => rawData.map((p) => ({
      time: toTimestamp(p.date),
      value: p.volume,
      color: p.close >= p.open
        ? 'rgba(38,166,154,0.5)'
        : 'rgba(239,83,80,0.5)',
    })),
    [rawData]
  )

  // Crosshair move handler
  const onCrosshairMove = useCallback((param: { time?: unknown; seriesData?: Map<unknown, unknown> }) => {
    if (!param.time || !param.seriesData) {
      setHoverInfo(null)
      return
    }
    const mainSeries = seriesRef.current
    if (!mainSeries) return
    const data = param.seriesData.get(mainSeries) as Record<string, number> | undefined
    if (!data) {
      setHoverInfo(null)
      return
    }

    const volSeries = volumeRef.current
    const volData = volSeries ? param.seriesData.get(volSeries) as Record<string, number> | undefined : undefined

    if ('open' in data) {
      setHoverInfo({
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: volData?.value ?? 0,
      })
    } else if ('value' in data) {
      setHoverInfo({
        open: data.value,
        high: data.value,
        low: data.value,
        close: data.value,
        volume: volData?.value ?? 0,
      })
    } else {
      setHoverInfo(null)
    }
  }, [])

  // Create chart
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: TV.bg },
        textColor: TV.muted,
        fontSize: 11,
        fontFamily: "'Trebuchet MS', sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: TV.border, style: LineStyle.Solid },
        horzLines: { color: TV.border, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderColor: TV.border,
        textColor: TV.muted,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: TV.border,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#758696',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: TV.accent,
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: TV.accent,
        },
      },
    })

    chartRef.current = chart
    chart.subscribeCrosshairMove(onCrosshairMove)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeRef.current = null
    }
  }, [timeframe, onCrosshairMove])

  // Add/update series
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current)
      seriesRef.current = null
    }

    if (effectiveChartMode === 'candle' && hasCandleData) {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: TV.green,
        downColor: TV.red,
        borderVisible: false,
        wickUpColor: TV.green,
        wickDownColor: TV.red,
      })
      s.setData(candleData)
      seriesRef.current = s
    } else {
      const s = chart.addSeries(AreaSeries, {
        lineColor: TV.accent,
        lineWidth: 2,
        topColor: 'rgba(41,98,255,0.28)',
        bottomColor: 'rgba(41,98,255,0)',
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: TV.accent,
        priceLineVisible: false,
        lastValueVisible: true,
      })
      s.setData(areaData)
      seriesRef.current = s
    }

    // Volume histogram
    if (!volumeRef.current) {
      volumeRef.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        lastValueVisible: false,
        priceLineVisible: false,
      })
      volumeRef.current.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      })
    }

    volumeRef.current.setData(volumeData)
    chart.timeScale().fitContent()
  }, [areaData, candleData, effectiveChartMode, hasCandleData, volumeData])

  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value)
    setHasChangedTimeframe(true)
  }

  // ── Inline styles (TV tokens, no CSS vars) ──────────────────────────
  const shellStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: fillHeight ? '100%' : undefined,
    background: TV.bg,
  }

  const toolbarStyle: React.CSSProperties = {
    background: TV.panel,
    borderBottom: `1px solid ${TV.border}`,
    padding: '4px 8px',
    flexShrink: 0,
  }

  const btnBase: React.CSSProperties = {
    height: 28,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 12,
    borderRadius: 3,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Trebuchet MS', sans-serif",
  }

  const inactiveBtn: React.CSSProperties = {
    ...btnBase,
    color: TV.muted,
    background: 'transparent',
  }

  const activeBtn: React.CSSProperties = {
    ...btnBase,
    color: TV.text,
    background: TV.border,
  }

  return (
    <div style={shellStyle}>
      {/* Row 1: OHLCV info bar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif" }}>
            {resolvedSymbol}
          </span>
          {displayInfo && (
            <>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace" }}>
                <span style={{ color: TV.muted }}>O </span>
                <span style={{ color: TV.text }}>{formatPrice(displayInfo.open)}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace" }}>
                <span style={{ color: TV.muted }}>H </span>
                <span style={{ color: TV.text }}>{formatPrice(displayInfo.high)}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace" }}>
                <span style={{ color: TV.muted }}>L </span>
                <span style={{ color: TV.text }}>{formatPrice(displayInfo.low)}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace" }}>
                <span style={{ color: TV.muted }}>C </span>
                <span style={{ color: TV.text }}>{formatPrice(displayInfo.close)}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace" }}>
                <span style={{ color: TV.muted }}>Vol </span>
                <span style={{ color: TV.text }}>{formatVolume(displayInfo.volume)}</span>
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Trebuchet MS', monospace", color: isUp ? TV.green : TV.red }}>
                {isUp ? '+' : ''}{formatPrice(change)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </>
          )}
        </div>

        {/* Row 2: timeframe + chart type buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {TIMEFRAMES.map((value) => (
              <button
                key={value}
                onClick={() => handleTimeframeChange(value)}
                style={timeframe === value ? activeBtn : inactiveBtn}
                onMouseEnter={(e) => {
                  if (timeframe !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (timeframe !== value) e.currentTarget.style.background = 'transparent'
                }}
              >
                {value}
              </button>
            ))}
          </div>

          {hasCandleData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => setChartMode('area')}
                style={effectiveChartMode === 'area' ? activeBtn : inactiveBtn}
                onMouseEnter={(e) => {
                  if (effectiveChartMode !== 'area') e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (effectiveChartMode !== 'area') e.currentTarget.style.background = 'transparent'
                }}
              >
                Line
              </button>
              <button
                onClick={() => setChartMode('candle')}
                style={effectiveChartMode === 'candle' ? activeBtn : inactiveBtn}
                onMouseEnter={(e) => {
                  if (effectiveChartMode !== 'candle') e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (effectiveChartMode !== 'candle') e.currentTarget.style.background = 'transparent'
                }}
              >
                Candle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart canvas */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {(loading || !hasData) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: TV.bg,
          }}>
            <span style={{ color: TV.muted, fontSize: 13 }}>
              {loading ? 'Loading…' : 'No data'}
            </span>
          </div>
        )}
        <div
          ref={containerRef}
          style={{ width: '100%', height: fillHeight ? '100%' : 380 }}
        />
      </div>
    </div>
  )
}
