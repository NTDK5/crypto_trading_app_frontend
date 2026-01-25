import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { lineElementClasses } from '@mui/x-charts/LineChart'
import { useMemo } from 'react'

type MarketSparklineProps = {
  data: number[]
  up: boolean
}

export function MarketSparkline({ data, up }: MarketSparklineProps) {
  // Normalize data to ensure proper scaling
  const normalizedData = useMemo(() => {
    if (data.length === 0) return []
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1 // Avoid division by zero
    
    // Normalize to 0-100 range for better visualization
    return data.map(value => ((value - min) / range) * 100)
  }, [data])

  if (normalizedData.length === 0) {
    return (
      <div 
        className="w-[190px] h-[40px] rounded"
        style={{ 
          background: `linear-gradient(to right, ${up ? '#22c55e' : '#ef4444'}20, ${up ? '#22c55e' : '#ef4444'}10)`
        }}
      />
    )
  }

  return (
    <div className="relative w-[190px] h-[40px]">
      <SparkLineChart
        data={normalizedData}
        width={190}
        height={40}
        curve="natural"
        
        // Disable interactive features for sparkline
        showTooltip={false}
        showHighlight={false}
        
        // Line chart without area fill
        area={false}
        color={up ? '#22c55e' : '#ef4444'}
        
        // Minimal margins for compact display
        margin={{ top: 4, bottom: 4, left: 0, right: 0 }}
        
        // Disable point markers
        slotProps={{
          mark: {
            style: { display: 'none' },
          },
        }}
        
        sx={{
          width: '100%',
          height: '100%',
          [`& .${lineElementClasses.root}`]: {
            strokeWidth: 2.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            filter: up
              ? 'drop-shadow(0 0 6px rgba(34,197,94,0.6))'
              : 'drop-shadow(0 0 6px rgba(239,68,68,0.6))',
          },
          // Hide all axis and grid elements
          '& .MuiChartsAxis-root': {
            display: 'none',
          },
          '& .MuiChartsGrid-root': {
            display: 'none',
          },
          '& .MuiChartsAxisLabel-root': {
            display: 'none',
          },
        }}
      />
    </div>
  )
}
