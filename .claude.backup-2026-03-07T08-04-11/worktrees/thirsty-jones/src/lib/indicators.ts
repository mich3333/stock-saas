export interface OHLCData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function calculateRSI(data: OHLCData[], period = 14): Array<{ date: string; rsi: number }> {
  const closes = data.map(d => d.close)
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }
  const result: Array<{ date: string; rsi: number }> = []
  for (let i = period; i < closes.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ date: data[i].date, rsi: Math.round((100 - 100 / (1 + rs)) * 100) / 100 })
  }
  return result
}

export function calculateMACD(data: OHLCData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const closes = data.map(d => d.close)
  function ema(values: number[], period: number): number[] {
    const k = 2 / (period + 1)
    const emas: number[] = [values[0]]
    for (let i = 1; i < values.length; i++) emas.push(values[i] * k + emas[i - 1] * (1 - k))
    return emas
  }
  const fastEMA = ema(closes, fastPeriod)
  const slowEMA = ema(closes, slowPeriod)
  const macdLine = fastEMA.map((f, i) => f - slowEMA[i])
  const signalLine = ema(macdLine.slice(slowPeriod - 1), signalPeriod)
  return data.slice(slowPeriod - 1).map((d, i) => ({
    date: d.date,
    macd: Math.round(macdLine[i + slowPeriod - 1] * 100) / 100,
    signal: signalLine[i] ? Math.round(signalLine[i] * 100) / 100 : null,
    histogram: signalLine[i] ? Math.round((macdLine[i + slowPeriod - 1] - signalLine[i]) * 100) / 100 : null,
  }))
}

export function calculateBollingerBands(data: OHLCData[], period = 20, stdDev = 2) {
  const closes = data.map(d => d.close)
  return data.slice(period - 1).map((d, i) => {
    const slice = closes.slice(i, i + period)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    return {
      date: d.date,
      upper: Math.round((mean + stdDev * std) * 100) / 100,
      middle: Math.round(mean * 100) / 100,
      lower: Math.round((mean - stdDev * std) * 100) / 100,
      close: d.close,
    }
  })
}
