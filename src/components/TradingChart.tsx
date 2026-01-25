import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, ColorType, Time } from 'lightweight-charts'

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

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    // Wait for container to have dimensions
    const initChart = () => {
      if (!chartContainerRef.current) return

      const container = chartContainerRef.current
      // Ensure minimum width
      const width = Math.max(container.clientWidth || 800, 100)

      // Create chart
      const chart = createChart(container, {
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
        width: width,
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

      // Verify chart object is valid
      if (!chart || typeof chart !== 'object') {
        console.error('Chart creation failed: invalid chart object')
        return
      }

      chartRef.current = chart

      // Add area series - use type assertion for compatibility
      try {
        const chartAny = chart as any
        
        // Try addAreaSeries first (if available in this version)
        let areaSeries: ISeriesApi<'Area'> | null = null
        
        if (typeof chartAny.addAreaSeries === 'function') {
          areaSeries = chartAny.addAreaSeries({
            lineColor: color,
            topColor: color + '40',
            bottomColor: color + '05',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          })
        } else if (typeof chartAny.addSeries === 'function') {
          // Fallback: use addSeries with proper typing
          const seriesDef = {
            seriesType: 'Area' as const,
            options: {
              lineColor: color,
              topColor: color + '40',
              bottomColor: color + '05',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
            },
          }
          areaSeries = chartAny.addSeries(seriesDef) as ISeriesApi<'Area'>
        }

        if (areaSeries) {
          seriesRef.current = areaSeries

          // Set data - convert time to proper format
          if (data.length > 0) {
            const formattedData = data.map((point) => ({
              time: point.time as Time,
              value: point.value,
            }))
            areaSeries.setData(formattedData)
          }
        }
      } catch (error) {
        console.error('Error adding area series:', error)
      }
    }

    // Initialize chart - use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      if (chartContainerRef.current) {
        if (chartContainerRef.current.clientWidth > 0) {
          initChart()
        } else {
          // If still no width, wait a bit more
          timeoutId = setTimeout(() => {
            initChart()
          }, 100)
        }
      }
    })

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
      cancelAnimationFrame(rafId)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      seriesRef.current = null
    }
  }, [color, height])

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formattedData = data.map((point) => ({
        time: point.time as Time,
        value: point.value,
      }))
      seriesRef.current.setData(formattedData)
    }
  }, [data])

  return (
    <div className="w-full" ref={chartContainerRef} style={{ height: `${height}px` }} />
  )
}




