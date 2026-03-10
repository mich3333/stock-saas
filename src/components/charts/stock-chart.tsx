'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { calculateRSI, calculateMACD, calculateBollingerBands, OHLCData } from '@/lib/indicators'

interface ChartData {
  date: string
  open?: number
  high?: number
  low?: number
  close: number
  volume: number
}

interface StockChartProps {
  data: ChartData[]
  symbol: string
  isPositive: boolean
}

const RANGES = ['1W', '1M', '3M', '1Y', 'ALL'] as const
type Range = typeof RANGES[number]

function filterByRange(data: ChartData[], range: Range): ChartData[] {
  if (range === 'ALL' || data.length === 0) return data
  const now = new Date()
  const cutoffs: Record<Range, number> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    ALL: Infinity,
  }
  const days = cutoffs[range]
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return data.filter((d) => new Date(d.date) >= cutoff)
}

// Custom candlestick shape for Recharts Bar
// Uses dataKey="ohlcRange" which is [low, high] so the bar spans the full price range.
// y = top of bar (high price), height = pixel distance from high to low.
// We compute open/close body positions proportionally within that range.
function CandleBar(props: Record<string, unknown>) {
  const { x, y, width, height, payload } = props as {
    x: number
    y: number
    width: number
    height: number
    payload: ChartData
  }
  if (!payload || payload.open == null || payload.high == null || payload.low == null) return null
  const { open, high, low, close } = payload
  const isUp = close >= open
  const color = isUp ? '#26a69a' : '#ef5350'

  const priceRange = high - low
  const absHeight = Math.abs(height)
  const barWidth = Math.max(width * 0.6, 4)
  const cx = x + width / 2

  // y maps to high (top), y + absHeight maps to low (bottom)
  const yHigh = y
  const yLow = y + absHeight

  if (priceRange === 0) {
    // Flat candle - just draw a line
    return (
      <g>
        <line x1={cx - barWidth / 2} x2={cx + barWidth / 2} y1={yHigh} y2={yHigh} stroke={color} strokeWidth={2} />
      </g>
    )
  }

  const yOpen = yHigh + ((high - open) / priceRange) * absHeight
  const yClose = yHigh + ((high - close) / priceRange) * absHeight

  const bodyTop = Math.min(yOpen, yClose)
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1)

  return (
    <g>
      {/* High-Low wick */}
      <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.5} />
      {/* Open-Close body */}
      <rect
        x={cx - barWidth / 2}
        y={bodyTop}
        width={barWidth}
        height={bodyHeight}
        fill={color}
        opacity={0.9}
      />
    </g>
  )
}

export function StockChart({ data, symbol, isPositive }: StockChartProps) {
  const [range, setRange] = useState<Range>('1M')
  const [chartType, setChartType] = useState<'line' | 'candle'>('line')
  const [showBB, setShowBB] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)

  const color = isPositive ? '#26a69a' : '#ef5350'
  const hasCandleData = data.some((d) => d.open != null && d.high != null && d.low != null)

  const filtered = useMemo(() => filterByRange(data, range), [data, range])

  const ohlcData: OHLCData[] = useMemo(
    () =>
      filtered
        .filter((d) => d.open != null && d.high != null && d.low != null)
        .map((d) => ({
          date: d.date,
          open: d.open!,
          high: d.high!,
          low: d.low!,
          close: d.close,
          volume: d.volume,
        })),
    [filtered]
  )

  const bbData = useMemo(() => (showBB && ohlcData.length >= 20 ? calculateBollingerBands(ohlcData) : []), [showBB, ohlcData])
  const rsiData = useMemo(() => (showRSI && ohlcData.length > 14 ? calculateRSI(ohlcData) : []), [showRSI, ohlcData])
  const macdData = useMemo(() => (showMACD && ohlcData.length > 26 ? calculateMACD(ohlcData) : []), [showMACD, ohlcData])

  // Merge bollinger bands + ohlcRange into chart data by date
  const chartData = useMemo(() => {
    const bbMap = showBB && bbData.length > 0 ? new Map(bbData.map((b) => [b.date, b])) : null
    return filtered.map((d) => {
      const bb = bbMap?.get(d.date)
      return {
        ...d,
        // ohlcRange for candlestick: [low, high] so Bar spans the full range
        ohlcRange: d.low != null && d.high != null ? [d.low, d.high] : undefined,
        ...(bb ? { bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower } : {}),
      }
    })
  }, [filtered, showBB, bbData])

  const tooltipStyle = {
    backgroundColor: '#1E222D',
    border: '1px solid #2A2E39',
    borderRadius: '4px',
    color: '#D1D4DC',
    fontSize: 12,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ background: '#1E222D', border: '1px solid #2A2E39', borderRadius: 4 }}
      className="p-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold" style={{ color: '#D1D4DC' }}>{symbol} Price Chart</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range selector */}
          <div className="flex overflow-hidden text-xs" style={{ border: '1px solid #2A2E39', borderRadius: 4 }}>
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1 transition-colors"
                style={{
                  background: range === r ? '#2962FF' : 'transparent',
                  color: range === r ? '#fff' : '#787B86',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart type toggle */}
          {hasCandleData && (
            <div className="flex overflow-hidden text-xs" style={{ border: '1px solid #2A2E39', borderRadius: 4 }}>
              {(['line', 'candle'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className="px-3 py-1 capitalize transition-colors"
                  style={{
                    background: chartType === t ? '#2962FF' : 'transparent',
                    color: chartType === t ? '#fff' : '#787B86',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Indicator toggles */}
          {[
            { label: 'BB', active: showBB, toggle: () => setShowBB((v) => !v) },
            { label: 'RSI', active: showRSI, toggle: () => setShowRSI((v) => !v) },
            { label: 'MACD', active: showMACD, toggle: () => setShowMACD((v) => !v) },
          ].map(({ label, active, toggle }) => (
            <button
              key={label}
              onClick={toggle}
              className="px-3 py-1 text-xs transition-colors"
              style={{
                border: `1px solid ${active ? '#2962FF' : '#2A2E39'}`,
                borderRadius: 4,
                background: active ? '#2962FF' : 'transparent',
                color: active ? '#fff' : '#787B86',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main price chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" opacity={0.8} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#787B86' }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis
            tick={{ fontSize: 11, fill: '#787B86' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={55}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | number[] | undefined, name: string | undefined) => {
              if (Array.isArray(value)) return [`$${value[0].toFixed(2)} - $${value[1].toFixed(2)}`, 'Range']
              return [`$${(value ?? 0).toFixed(2)}`, name ?? '']
            }}
          />

          {chartType === 'line' ? (
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              name="Price"
            />
          ) : (
            <Bar dataKey="ohlcRange" shape={<CandleBar />} isAnimationActive={false} name="Price" />
          )}

          {showBB && (
            <>
              <Line type="monotone" dataKey="bbUpper" stroke="#9333ea" strokeWidth={1} strokeDasharray="4 2" dot={false} name="BB Upper" />
              <Line type="monotone" dataKey="bbMiddle" stroke="#9333ea" strokeWidth={1} dot={false} name="BB Mid" />
              <Line type="monotone" dataKey="bbLower" stroke="#9333ea" strokeWidth={1} strokeDasharray="4 2" dot={false} name="BB Lower" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume sub-chart */}
      <div className="mt-2">
        <p className="text-xs mb-1 font-medium" style={{ color: '#787B86' }}>Volume</p>
        <ResponsiveContainer width="100%" height={80}>
          <ComposedChart data={chartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#787B86' }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v: number) => {
                if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
                if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
                if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
                return String(v)
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number | undefined) => {
                const val = v ?? 0
                if (val >= 1e9) return [`${(val / 1e9).toFixed(2)}B`, 'Volume']
                if (val >= 1e6) return [`${(val / 1e6).toFixed(2)}M`, 'Volume']
                return [val.toLocaleString(), 'Volume']
              }}
            />
            <Bar dataKey="volume" isAnimationActive={false} name="Volume">
              {chartData.map((entry, index) => (
                <Cell
                  key={`vol-${index}`}
                  fill={
                    entry.close >= (entry.open ?? entry.close) ? '#26a69a' : '#ef5350'
                  }
                  opacity={0.5}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI sub-chart */}
      {showRSI && rsiData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs mb-1 font-medium" style={{ color: '#787B86' }}>RSI (14)</p>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={rsiData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" opacity={0.8} />
              <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#787B86' }} tickLine={false} axisLine={false} width={35} ticks={[30, 50, 70]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [(v ?? 0).toFixed(1), 'RSI']} />
              <ReferenceLine y={70} stroke="#ef5350" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#26a69a" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD sub-chart */}
      {showMACD && macdData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs mb-1 font-medium" style={{ color: '#787B86' }}>MACD (12, 26, 9)</p>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={macdData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" opacity={0.8} />
              <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#787B86' }} tickLine={false} axisLine={false} width={45} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [(v ?? 0).toFixed(2), '']} />
              <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
              <Bar dataKey="histogram" fill="#2962FF" opacity={0.6} name="Histogram" isAnimationActive={false} />
              <Line type="monotone" dataKey="macd" stroke="#2962FF" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
