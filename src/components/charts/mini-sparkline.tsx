'use client'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MiniSparklineProps {
  data: number[] | { close: number }[]
  positive?: boolean
  height?: number
}

function toValues(data: number[] | { close: number }[]): number[] {
  if (data.length === 0) return []
  if (typeof data[0] === 'number') return data as number[]
  return (data as { close: number }[]).map((d) => d.close)
}

export function MiniSparkline({ data, positive = true, height = 40 }: MiniSparklineProps) {
  const values = toValues(data)
  if (values.length < 2) return null

  const color = positive ? '#26a69a' : '#ef5350'

  const chartData = values.map((v, i) => ({ v, i }))

  return (
    <div style={{ background: '#131722' }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
