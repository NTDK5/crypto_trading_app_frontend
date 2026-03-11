import { useEffect, useRef } from 'react'
import * as LightweightCharts from 'lightweight-charts'
import { IChartApi, ISeriesApi, ColorType, Time } from 'lightweight-charts'
import { CandlestickData } from '../services/binanceService'

interface CandlestickChartProps {
  data: CandlestickData[]
  height?: number
}

export default function CandlestickChart({ data, height = 500 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma14SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma28SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    const width = Math.max(container.clientWidth || 800, 100)

    // Create chart
    const chart = LightweightCharts.createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: {
          color: '#1e293b',
          style: 1,
        },
        horzLines: {
          color: '#1e293b',
          style: 1,
        },
      },
      width: width,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#334155',
      },
      rightPriceScale: {
        borderColor: '#334155',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    })

    chartRef.current = chart

    const chartAny = chart as any
    if (!chartAny.addCandlestickSeries || !chartAny.addLineSeries) {
      throw new Error('Chart series APIs unavailable')
    }

    const candlestickSeriesInstance: ISeriesApi<'Candlestick'> = chartAny.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    candlestickSeriesRef.current = candlestickSeriesInstance

    // Calculate and add moving averages
    if (data.length > 0) {
      const calculateMA = (period: number) => {
        const maData: Array<{ time: Time; value: number }> = []
        for (let i = period - 1; i < data.length; i++) {
          let sum = 0
          for (let j = i - period + 1; j <= i; j++) {
            sum += data[j].close
          }
          maData.push({
            time: data[i].time as Time,
            value: sum / period,
          })
        }
        return maData
      }

      const ma7Data = calculateMA(7)
      const ma14Data = calculateMA(14)
      const ma28Data = calculateMA(28)

      // Add MA7 (yellow)
      if (ma7Data.length > 0) {
        const ma7SeriesInstance: ISeriesApi<'Line'> = chartAny.addLineSeries({
          color: '#eab308',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        })
        ma7SeriesInstance.setData(ma7Data)
        ma7SeriesRef.current = ma7SeriesInstance
      }

      // Add MA14 (blue)
      if (ma14Data.length > 0) {
        const ma14SeriesInstance: ISeriesApi<'Line'> = chartAny.addLineSeries({
          color: '#3b82f6',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        })
        ma14SeriesInstance.setData(ma14Data)
        ma14SeriesRef.current = ma14SeriesInstance
      }

      // Add MA28 (purple)
      if (ma28Data.length > 0) {
        const ma28SeriesInstance: ISeriesApi<'Line'> = chartAny.addLineSeries({
          color: '#a855f7',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
        })
        ma28SeriesInstance.setData(ma28Data)
        ma28SeriesRef.current = ma28SeriesInstance
      }

      // Set candlestick data
      // Set candlestick data
      const formattedData = data.map((candle) => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))

      candlestickSeriesInstance.setData(formattedData)

      // Fitting content to zoom in and show all data
      chart.timeScale().fitContent()

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
        chartRef.current = null
      }
      candlestickSeriesRef.current = null
      ma7SeriesRef.current = null
      ma14SeriesRef.current = null
      ma28SeriesRef.current = null
    }
  }, [height])

  // Update data when it changes
  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      const formattedData = data.map((candle) => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))
      candlestickSeriesRef.current.setData(formattedData)

      // Update moving averages
      const calculateMA = (period: number) => {
        const maData: Array<{ time: Time; value: number }> = []
        for (let i = period - 1; i < data.length; i++) {
          let sum = 0
          for (let j = i - period + 1; j <= i; j++) {
            sum += data[j].close
          }
          maData.push({
            time: data[i].time as Time,
            value: sum / period,
          })
        }
        return maData
      }

      if (ma7SeriesRef.current) {
        const ma7Data = calculateMA(7)
        if (ma7Data.length > 0) {
          ma7SeriesRef.current.setData(ma7Data)
        }
      }

      if (ma14SeriesRef.current) {
        const ma14Data = calculateMA(14)
        if (ma14Data.length > 0) {
          ma14SeriesRef.current.setData(ma14Data)
        }
      }

      if (ma28SeriesRef.current) {
        const ma28Data = calculateMA(28)
        if (ma28Data.length > 0) {
          ma28SeriesRef.current.setData(ma28Data)
        }
      }

      // Auto-scroll to the latest data and fit content
      if (chartRef.current && formattedData.length > 0) {
        chartRef.current.timeScale().fitContent()
      }
    }
  }, [data])

  return (
    <div className="w-full" ref={chartContainerRef} style={{ height: `${height}px` }} />
  )
}

