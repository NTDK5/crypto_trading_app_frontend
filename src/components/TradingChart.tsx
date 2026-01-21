import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts'

interface TradingChartProps {
  data: Array<{ time: number; value: number }>
  color?: string
  height?: number
}

export default function TradingChart({ data, color = '#00d4ff', height = 400 }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: {
          color: '#1f2937',
          style: 1,
        },
        horzLines: {
          color: '#1f2937',
          style: 1,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    })

    chartRef.current = chart

    // Add area series
    const areaSeries = chart.addAreaSeries({
      lineColor: color,
      topColor: color + '40',
      bottomColor: color + '05',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    seriesRef.current = areaSeries

    // Set data
    if (data.length > 0) {
      areaSeries.setData(data)
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data)
    }
  }, [data])

  return (
    <div className="w-full" ref={chartContainerRef} style={{ height: `${height}px` }} />
  )
}

