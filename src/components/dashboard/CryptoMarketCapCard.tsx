'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  AreaSeries,
} from 'lightweight-charts'

type SparkPoint = { time: UTCTimestamp; value: number }

const POSITIVE = '#26a69a'
const NEGATIVE = '#ef5350'

function formatMarketCap(v: number | null): string {
  if (v === null || !isFinite(v)) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}

function formatPercent(v: number | null): string {
  if (v === null || !isFinite(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

export default function CryptoMarketCapCard() {
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [changePct, setChangePct] = useState<number | null>(null)
  const [spark, setSpark] = useState<SparkPoint[]>([])
  const [loading, setLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  // Fetch data
  useEffect(() => {
    let cancelled = false

    async function load() {
      // Total market cap + 24h change
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/global', {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = await res.json()
          const cap = json?.data?.total_market_cap?.usd ?? null
          const pct =
            json?.data?.market_cap_change_percentage_24h_usd ?? null
          if (!cancelled) {
            if (cap !== null) setMarketCap(cap)
            if (pct !== null) setChangePct(pct)
          }
        }
      } catch {
        // keep last known state
      }

      // Sparkline history
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/global/market_cap_chart?days=7',
          { cache: 'no-store' }
        )
        if (!res.ok) throw new Error('global chart failed')
        const json = await res.json()
        const series: [number, number][] =
          json?.market_cap_chart?.market_cap ?? json?.market_cap ?? []
        if (!Array.isArray(series) || series.length === 0) {
          throw new Error('empty series')
        }
        const pts: SparkPoint[] = series.map(([t, v]) => ({
          time: Math.floor(t / 1000) as UTCTimestamp,
          value: v,
        }))
        if (!cancelled) setSpark(pts)
      } catch {
        // Fallback: bitcoin market cap history as a proxy
        try {
          const res = await fetch(
            'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7',
            { cache: 'no-store' }
          )
          if (res.ok) {
            const json = await res.json()
            const series: [number, number][] = json?.prices ?? []
            if (Array.isArray(series) && series.length > 0) {
              const pts: SparkPoint[] = series.map(([t, v]) => ({
                time: Math.floor(t / 1000) as UTCTimestamp,
                value: v,
              }))
              if (!cancelled) setSpark(pts)
            }
          }
        } catch {
          // graceful — leave spark empty
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    const id = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return
    if (chartRef.current) return

    const isPos = (changePct ?? 0) >= 0
    const color = isPos ? POSITIVE : NEGATIVE

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 60,
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#9ca3af',
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}55`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Update series data + color
  useEffect(() => {
    if (!seriesRef.current) return
    if (spark.length === 0) return
    const isPos = (changePct ?? 0) >= 0
    const color = isPos ? POSITIVE : NEGATIVE
    seriesRef.current.applyOptions({
      lineColor: color,
      topColor: `${color}55`,
      bottomColor: `${color}00`,
    })
    seriesRef.current.setData(spark)
    chartRef.current?.timeScale().fitContent()
  }, [spark, changePct])

  const isPos = (changePct ?? 0) >= 0
  const changeColor = changePct === null ? '#9ca3af' : isPos ? POSITIVE : NEGATIVE

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
    >
      <div
        className="px-4 py-3 text-sm font-semibold text-white"
        style={{ borderBottom: '1px solid #2a2e39' }}
      >
        Crypto market cap
      </div>
      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            {loading && marketCap === null ? (
              <>
                <div className="h-7 w-28 rounded bg-[#2a2e39] animate-pulse mb-2" />
                <div className="h-3 w-16 rounded bg-[#2a2e39] animate-pulse" />
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-white tabular-nums">
                  {formatMarketCap(marketCap)}
                </span>
                <span
                  className="text-sm mt-1 tabular-nums"
                  style={{ color: changeColor }}
                >
                  {formatPercent(changePct)}{' '}
                  <span className="text-xs text-gray-400">24h</span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 relative" style={{ height: 60 }}>
          {loading && spark.length === 0 && (
            <div className="absolute inset-0 rounded bg-[#2a2e39] animate-pulse" />
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  )
}
