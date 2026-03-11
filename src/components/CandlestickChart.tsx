import { useEffect, useRef } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  Time,
  CandlestickData as ChartCandlestickData,
  LineData,
  CandlestickSeries,
  LineSeries
} from 'lightweight-charts'
import { CandlestickData } from '../services/binanceService'

interface CandlestickChartProps {
  data: CandlestickData[]
}

export default function CandlestickChart({ data }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma7SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma14SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma28SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // Internal helper to calculate MA
  const calculateMA = (candles: CandlestickData[], period: number) => {
    const maData: LineData[] = []
    if (candles.length < period) return maData

    for (let i = period - 1; i < candles.length; i++) {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += candles[j].close
      }
      maData.push({
        time: candles[i].time as Time,
        value: sum / period,
      })
    }
    return maData
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      autoSize: true,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#334155',
      },
      rightPriceScale: {
        borderColor: '#334155',
        autoScale: true,
      },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    const ma7Series = chart.addSeries(LineSeries, {
      color: '#eab308',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    const ma14Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    const ma28Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    chartApiRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    ma7SeriesRef.current = ma7Series
    ma14SeriesRef.current = ma14Series
    ma28SeriesRef.current = ma28Series

    return () => {
      chart.remove()
      chartApiRef.current = null
      candlestickSeriesRef.current = null
      ma7SeriesRef.current = null
      ma14SeriesRef.current = null
      ma28SeriesRef.current = null
    }
  }, [])

  // Update data
  useEffect(() => {
    if (!candlestickSeriesRef.current || data.length === 0) return

    const formattedData: ChartCandlestickData[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    candlestickSeriesRef.current.setData(formattedData)

    if (ma7SeriesRef.current) ma7SeriesRef.current.setData(calculateMA(data, 7))
    if (ma14SeriesRef.current) ma14SeriesRef.current.setData(calculateMA(data, 14))
    if (ma28SeriesRef.current) ma28SeriesRef.current.setData(calculateMA(data, 28))

    // Fix content on initial load or significant data change
    if (chartApiRef.current) {
      chartApiRef.current.timeScale().fitContent()
    }
  }, [data])

  return (
    <div className="w-full h-full" ref={chartContainerRef} />
  )
}
