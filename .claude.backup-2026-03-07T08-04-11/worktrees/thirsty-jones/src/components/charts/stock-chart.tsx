'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

// Custom candlestick shape for recharts Bar
function CandleBar(props: any) {
  const { x, y, width, payload } = props
  if (!payload || payload.open == null || payload.high == null || payload.low == null) return null
  const { open, high, low, close } = payload
  const isUp = close >= open
  const color = isUp ? '#22c55e' : '#ef4444'
  const bodyTop = Math.min(open, close)
  const bodyBottom = Math.max(open, close)
  const scale = props.yAxis ? (props.yAxis.height / (props.yAxis.niceTicks?.[props.yAxis.niceTicks.length - 1] - props.yAxis.niceTicks?.[0] || 1)) : 1
  // Use the chart coordinate system via recharts internal yAxis ref
  // Instead, render nothing and let ComposedChart handle via custom cell
  const barWidth = Math.max(width * 0.6, 4)
  const cx = x + width / 2

  // Note: in recharts, y is the top of the bar from the chart's perspective
  // We receive y as the calculated position from recharts
  // For composed chart with custom shape, we render SVG directly
  return (
    <g>
      {/* High-Low wick */}
      <line x1={cx} x2={cx} y1={y} y2={y + props.height} stroke={color} strokeWidth={1.5} />
      {/* Body */}
      <rect
        x={cx - barWidth / 2}
        y={isUp ? y : y}
        width={barWidth}
        height={Math.max(Math.abs(props.height), 1)}
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

  const color = isPositive ? '#22c55e' : '#ef4444'
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

  // Merge bollinger bands into chart data by date
  const chartData = useMemo(() => {
    if (!showBB || bbData.length === 0) return filtered
    const bbMap = new Map(bbData.map((b) => [b.date, b]))
    return filtered.map((d) => {
      const bb = bbMap.get(d.date)
      return bb ? { ...d, bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower } : d
    })
  }, [filtered, showBB, bbData])

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: 12,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{symbol} Price Chart</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Range selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 transition-colors ${
                  range === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart type toggle */}
          {hasCandleData && (
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
              {(['line', 'candle'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    chartType === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
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
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                active
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={55}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | undefined, name: string | undefined) => [`$${(value ?? 0).toFixed(2)}`, name ?? '']}
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
            <Bar dataKey="close" shape={<CandleBar />} isAnimationActive={false} name="Price" />
          )}

          {showBB && (
            <>
              <Line type="monotone" dataKey="bbUpper" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 2" dot={false} name="BB Upper" />
              <Line type="monotone" dataKey="bbMiddle" stroke="#a855f7" strokeWidth={1} dot={false} name="BB Mid" />
              <Line type="monotone" dataKey="bbLower" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 2" dot={false} name="BB Lower" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* RSI sub-chart */}
      {showRSI && rsiData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">RSI (14)</p>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={rsiData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={35} ticks={[30, 50, 70]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [(v ?? 0).toFixed(1), 'RSI']} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD sub-chart */}
      {showMACD && macdData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">MACD (12, 26, 9)</p>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={macdData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={45} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [(v ?? 0).toFixed(2), '']} />
              <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
              <Bar dataKey="histogram" fill="#6366f1" opacity={0.7} name="Histogram" isAnimationActive={false} />
              <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
