'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type Time,
} from 'lightweight-charts'

type RangeKey = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y'

const RANGES: { key: RangeKey; range: string; interval: string }[] = [
  { key: '1D', range: '1d', interval: '5m' },
  { key: '1W', range: '5d', interval: '15m' },
  { key: '1M', range: '1mo', interval: '1d' },
  { key: '3M', range: '3mo', interval: '1d' },
  { key: '6M', range: '6mo', interval: '1d' },
  { key: '1Y', range: '1y', interval: '1d' },
]

const UP_COLOR = '#26a69a'
const DOWN_COLOR = '#ef5350'
const BG = '#131722'
const BORDER = '#2a2e39'
const MUTED = '#787b86'

interface ChartPoint {
  time: UTCTimestamp
  value: number
}

export default function MarketSummaryChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  const [selectedRange, setSelectedRange] = useState<RangeKey>('1M')
  const [data, setData] = useState<ChartPoint[]>([])
  const [price, setPrice] = useState<number | null>(null)
  const [changePct, setChangePct] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch data from Yahoo when range changes
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      try {
        const cfg = RANGES.find((r) => r.key === selectedRange)!
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?range=${cfg.range}&interval=${cfg.interval}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        const result = json?.chart?.result?.[0]
        const timestamps: number[] = result?.timestamp ?? []
        const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close ?? []

        const points: ChartPoint[] = []
        for (let i = 0; i < timestamps.length; i++) {
          const c = closes[i]
          if (c == null || !Number.isFinite(c)) continue
          points.push({ time: timestamps[i] as UTCTimestamp, value: c })
        }

        if (cancelled) return

        if (points.length > 0) {
          const first = points[0].value
          const last = points[points.length - 1].value
          setPrice(last)
          setChangePct(first === 0 ? 0 : ((last - first) / first) * 100)
        } else {
          setPrice(null)
          setChangePct(null)
        }
        setData(points)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Silent failure; render empty state
          if (!cancelled) {
            setData([])
            setPrice(null)
            setChangePct(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [selectedRange])

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
      layout: {
        background: { color: BG },
        textColor: MUTED,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      rightPriceScale: { borderColor: BORDER },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: MUTED, width: 1, style: 3 },
        horzLine: { color: MUTED, width: 1, style: 3 },
      },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: UP_COLOR,
      topColor: 'rgba(38, 166, 154, 0.4)',
      bottomColor: 'rgba(38, 166, 154, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Push data to series
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
    seriesRef.current.setData(data as { time: Time; value: number }[])
    if (data.length > 0) chartRef.current.timeScale().fitContent()
  }, [data])

  const isUp = (changePct ?? 0) >= 0
  const changeColor = isUp ? UP_COLOR : DOWN_COLOR

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide" style={{ color: MUTED }}>
              S&amp;P 500
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: MUTED, backgroundColor: '#1e222d' }}>
              SPX
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-white tabular-nums">
              {price != null
                ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            <span className="text-sm font-medium tabular-nums" style={{ color: changeColor }}>
              {changePct != null
                ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1">
          {RANGES.map((r) => {
            const active = r.key === selectedRange
            return (
              <button
                key={r.key}
                onClick={() => setSelectedRange(r.key)}
                className="px-2.5 py-1 text-xs font-medium rounded transition-colors"
                style={{
                  backgroundColor: active ? '#2a2e39' : 'transparent',
                  color: active ? '#ffffff' : MUTED,
                }}
              >
                {r.key}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div ref={containerRef} style={{ width: '100%', height: 320 }} />
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(19, 23, 34, 0.6)' }}
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: UP_COLOR, borderTopColor: 'transparent' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
