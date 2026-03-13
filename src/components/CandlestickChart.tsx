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
  LineSeries,
} from 'lightweight-charts'
import { CandlestickData } from '../services/binanceService'

interface CandlestickChartProps {
  data: CandlestickData[]
}

/** Deduplicate & sort candles by time ascending — required by lightweight-charts */
function normalise(data: CandlestickData[]): CandlestickData[] {
  const map = new Map<number, CandlestickData>()
  for (const c of data) map.set(c.time, c)          // last write wins for same timestamp
  return Array.from(map.values()).sort((a, b) => a.time - b.time)
}

function calculateMA(candles: CandlestickData[], period: number): LineData[] {
  if (candles.length < period) return []
  const result: LineData[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    result.push({ time: candles[i].time as Time, value: sum / period })
  }
  return result
}

export default function CandlestickChart({ data }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma7Ref       = useRef<ISeriesApi<'Line'> | null>(null)
  const ma14Ref      = useRef<ISeriesApi<'Line'> | null>(null)
  const ma28Ref      = useRef<ISeriesApi<'Line'> | null>(null)
  const prevLenRef   = useRef<number>(0)

  // ── Create chart once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
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
      crosshair: {
        mode: 1,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:      '#10b981',
      downColor:    '#ef4444',
      borderVisible: false,
      wickUpColor:  '#10b981',
      wickDownColor: '#ef4444',
    })

    const ma7Series  = chart.addSeries(LineSeries, { color: '#eab308', lineWidth: 1, priceLineVisible: false, lastValueVisible: true })
    const ma14Series = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceLineVisible: false, lastValueVisible: true })
    const ma28Series = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: true })

    chartRef.current  = chart
    candleRef.current = candleSeries
    ma7Ref.current    = ma7Series
    ma14Ref.current   = ma14Series
    ma28Ref.current   = ma28Series

    return () => {
      chart.remove()
      chartRef.current  = null
      candleRef.current = null
      ma7Ref.current    = null
      ma14Ref.current   = null
      ma28Ref.current   = null
      prevLenRef.current = 0
    }
  }, [])

  // ── Update data whenever it changes ───────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || data.length === 0) return

    const clean = normalise(data)

    const formatted: ChartCandlestickData[] = clean.map(d => ({
      time:  d.time as Time,
      open:  d.open,
      high:  d.high,
      low:   d.low,
      close: d.close,
    }))

    const isLiveUpdate =
      prevLenRef.current > 0 &&
      (clean.length === prevLenRef.current || clean.length === prevLenRef.current + 1)

    if (isLiveUpdate) {
      // Update only the last candle (or append one new one) — much cheaper
      candleRef.current.update(formatted[formatted.length - 1])
    } else {
      // Full reload (symbol / timeframe change, initial load)
      candleRef.current.setData(formatted)
      chartRef.current?.timeScale().fitContent()
    }

    prevLenRef.current = clean.length

    // Always recalculate MAs on the full clean dataset
    ma7Ref.current?.setData(calculateMA(clean, 7))
    ma14Ref.current?.setData(calculateMA(clean, 14))
    ma28Ref.current?.setData(calculateMA(clean, 28))
  }, [data])

  return <div className="w-full h-full" ref={containerRef} />
}
