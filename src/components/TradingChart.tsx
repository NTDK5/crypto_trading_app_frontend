import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, ColorType, Time, AreaSeries } from 'lightweight-charts'

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

    const container = chartContainerRef.current

    // Initialize chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: container.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
        autoScale: true,
      },
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: color + '40',
      bottomColor: color + '05',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    chartRef.current = chart
    seriesRef.current = areaSeries

    // Set initial data
    if (data.length > 0) {
      const sortedData = [...data].sort((a, b) => a.time - b.time)
      const formattedData = sortedData.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }))
      areaSeries.setData(formattedData)

      // Fitting content to zoom in and show all data
      chart.timeScale().fitContent()
    }

    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return
      const { width } = entries[0].contentRect
      chartRef.current.applyOptions({ width })
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      seriesRef.current = null
    }
  }, [color, height])

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const sortedData = [...data].sort((a, b) => a.time - b.time)
      const formattedData = sortedData.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }))
      seriesRef.current.setData(formattedData)
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }
  }, [data])

  return (
    <div className="w-full relative" ref={chartContainerRef} style={{ height: `${height}px` }} />
  )
}




