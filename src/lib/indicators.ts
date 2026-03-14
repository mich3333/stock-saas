// ---------------------------------------------------------------------------
// Default periods / magic numbers extracted as named constants
// ---------------------------------------------------------------------------
const RSI_DEFAULT_PERIOD = 14
const MACD_DEFAULT_FAST = 12
const MACD_DEFAULT_SLOW = 26
const MACD_DEFAULT_SIGNAL = 9
const BB_DEFAULT_PERIOD = 20
const BB_DEFAULT_STD_DEV = 2
/** Multiplier used to round results to 2 decimal places (100 = 10^2). */
const ROUND_FACTOR = 100

export interface OHLCData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Calculates the Relative Strength Index (RSI) using Wilder's smoothing method.
 *
 * @param data   - Array of OHLC candles ordered oldest → newest.
 * @param period - Lookback period (default 14).
 * @returns Array of `{ date, rsi }` objects starting from index `period`.
 *          Returns an empty array when `data` has fewer bars than `period + 1`.
 */
export function calculateRSI(
  data: OHLCData[],
  period = RSI_DEFAULT_PERIOD,
): Array<{ date: string; rsi: number }> {
  if (!data || data.length <= period) return []

  const closes = data.map(d => d.close)
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }

  // Seed averages with a simple mean for the first `period` bars (Wilder's method)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  const result: Array<{ date: string; rsi: number }> = []

  for (let i = period; i < closes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({
      date: data[i].date,
      rsi: Math.round((100 - 100 / (1 + rs)) * ROUND_FACTOR) / ROUND_FACTOR,
    })
  }

  return result
}

export interface MACDResult {
  date: string
  macd: number
  signal: number | null
  histogram: number | null
}

/**
 * Calculates MACD (Moving Average Convergence/Divergence) using exponential
 * moving averages.
 *
 * @param data         - Array of OHLC candles ordered oldest → newest.
 * @param fastPeriod   - Fast EMA period (default 12).
 * @param slowPeriod   - Slow EMA period (default 26).
 * @param signalPeriod - Signal EMA period (default 9).
 * @returns Array of `{ date, macd, signal, histogram }` objects.
 *          Returns an empty array when `data` has fewer bars than `slowPeriod`.
 */
export function calculateMACD(
  data: OHLCData[],
  fastPeriod = MACD_DEFAULT_FAST,
  slowPeriod = MACD_DEFAULT_SLOW,
  signalPeriod = MACD_DEFAULT_SIGNAL,
): MACDResult[] {
  if (!data || data.length < slowPeriod) return []

  const closes = data.map(d => d.close)

  /** Computes an EMA series for the given values and period. */
  function ema(values: number[], period: number): number[] {
    const k = 2 / (period + 1)
    const emas: number[] = [values[0]]
    for (let i = 1; i < values.length; i++) {
      emas.push(values[i] * k + emas[i - 1] * (1 - k))
    }
    return emas
  }

  const fastEMA = ema(closes, fastPeriod)
  const slowEMA = ema(closes, slowPeriod)
  const macdLine = fastEMA.map((f, i) => f - slowEMA[i])
  const signalLine = ema(macdLine.slice(slowPeriod - 1), signalPeriod)

  return data.slice(slowPeriod - 1).map((d, i) => ({
    date: d.date,
    macd: Math.round(macdLine[i + slowPeriod - 1] * ROUND_FACTOR) / ROUND_FACTOR,
    signal: signalLine[i] ? Math.round(signalLine[i] * ROUND_FACTOR) / ROUND_FACTOR : null,
    histogram: signalLine[i]
      ? Math.round((macdLine[i + slowPeriod - 1] - signalLine[i]) * ROUND_FACTOR) / ROUND_FACTOR
      : null,
  }))
}

/**
 * Calculates the Volume-Weighted Average Price (VWAP) over the entire dataset.
 *
 * @param data - Array of OHLC candles ordered oldest → newest.
 * @returns Array of `{ date, vwap }` objects, one per input candle.
 *          Returns an empty array when `data` is empty or falsy.
 */
export function calculateVWAP(
  data: OHLCData[],
): Array<{ date: string; vwap: number }> {
  if (!data || data.length === 0) return []

  let cumulativeTPV = 0
  let cumulativeVolume = 0

  return data.map(d => {
    const typicalPrice = (d.high + d.low + d.close) / 3
    cumulativeTPV += typicalPrice * d.volume
    cumulativeVolume += d.volume
    return {
      date: d.date,
      vwap:
        cumulativeVolume === 0
          ? 0
          : Math.round((cumulativeTPV / cumulativeVolume) * ROUND_FACTOR) / ROUND_FACTOR,
    }
  })
}

export interface BollingerBandPoint {
  date: string
  upper: number
  middle: number
  lower: number
  close: number
}

/**
 * Calculates Bollinger Bands using a simple moving average and population
 * standard deviation.
 *
 * @param data   - Array of OHLC candles ordered oldest → newest.
 * @param period - SMA/band lookback period (default 20).
 * @param stdDev - Number of standard deviations for the bands (default 2).
 * @returns Array of `{ date, upper, middle, lower, close }` objects starting
 *          from index `period - 1`.
 *          Returns an empty array when `data` has fewer bars than `period`.
 */
export function calculateBollingerBands(
  data: OHLCData[],
  period = BB_DEFAULT_PERIOD,
  stdDev = BB_DEFAULT_STD_DEV,
): BollingerBandPoint[] {
  if (!data || data.length < period) return []

  const closes = data.map(d => d.close)

  return data.slice(period - 1).map((d, i) => {
    const slice = closes.slice(i, i + period)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    return {
      date: d.date,
      upper: Math.round((mean + stdDev * std) * ROUND_FACTOR) / ROUND_FACTOR,
      middle: Math.round(mean * ROUND_FACTOR) / ROUND_FACTOR,
      lower: Math.round((mean - stdDev * std) * ROUND_FACTOR) / ROUND_FACTOR,
      close: d.close,
    }
  })
}
