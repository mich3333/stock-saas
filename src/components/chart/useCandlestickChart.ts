'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickSeriesPartialOptions,
  type DeepPartial,
  type ChartOptions,
} from 'lightweight-charts'

export interface OHLCVBar {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartThemeConfig {
  background: string
  textColor: string
  gridColor: string
  upColor: string
  downColor: string
}

export const DEFAULT_THEME: ChartThemeConfig = {
  background: '#131722',
  textColor: '#d1d4dc',
  gridColor: '#2a2e39',
  upColor: '#26a69a',
  downColor: '#ef5350',
}

interface UseCandlestickChartOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  data: OHLCVBar[]
  theme?: ChartThemeConfig
}

interface UseCandlestickChartReturn {
  chart: IChartApi | null
  series: ISeriesApi<'Candlestick'> | null
  updateBar: (bar: OHLCVBar) => void
  resetData: (bars: OHLCVBar[]) => void
}

export function useCandlestickChart({
  containerRef,
  data,
  theme = DEFAULT_THEME,
}: UseCandlestickChartOptions): UseCandlestickChartReturn {
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  // Initialize chart
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chartOptions: DeepPartial<ChartOptions> = {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.textColor,
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: theme.gridColor, style: LineStyle.Solid },
        horzLines: { color: theme.gridColor, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: theme.textColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(209, 212, 220, 0.3)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: 'rgba(209, 212, 220, 0.3)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962ff',
        },
      },
    }

    const chart = createChart(container, chartOptions)
    chartRef.current = chart

    const seriesOptions: CandlestickSeriesPartialOptions = {
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderVisible: false,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    }

    const candleSeries = chart.addSeries(CandlestickSeries, seriesOptions)
    seriesRef.current = candleSeries

    if (data.length > 0) {
      // Strip volume from the data passed to the chart series (IChartApi only needs OHLC + time)
      candleSeries.setData(
        data.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
      )
      chart.timeScale().fitContent()
    }

    // ResizeObserver for full responsiveness
    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.background, theme.textColor, theme.gridColor, theme.upColor, theme.downColor])

  // Sync data changes after initial mount
  useEffect(() => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart || data.length === 0) return

    series.setData(
      data.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
    )
    chart.timeScale().fitContent()
  }, [data])

  const updateBar = useCallback((bar: OHLCVBar) => {
    const series = seriesRef.current
    if (!series) return
    const { time, open, high, low, close } = bar
    series.update({ time, open, high, low, close })
  }, [])

  const resetData = useCallback((bars: OHLCVBar[]) => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return
    series.setData(
      bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
    )
    chart.timeScale().fitContent()
  }, [])

  return {
    chart: chartRef.current,
    series: seriesRef.current,
    updateBar,
    resetData,
  }
}
