import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { useMemo } from 'react'

type MarketSparklineProps = {
  data: number[]
  up: boolean
}

export function MarketSparkline({ data, up }: MarketSparklineProps) {
  const chartData = useMemo(() => {
    return data.map((val, i) => ({ i, val }))
  }, [data])

  if (!data || data.length === 0) {
    return <div className="h-[40px] w-[120px] bg-gray-800/20 rounded" />
  }

  const color = up ? '#22c55e' : '#ef4444'

  return (
    <div className="h-[50px] w-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
