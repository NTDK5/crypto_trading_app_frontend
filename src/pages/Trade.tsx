import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  binanceService,
  subscribeTicker,
  subscribeOrderBook,
  subscribeKline,
  BinanceTicker,
  BinanceOrderBook,
  CandlestickData,
} from '../services/binanceService'
import MarketList from '../components/MarketList'
import OrderBook from '../components/OrderBook'
import CandlestickChart from '../components/CandlestickChart'
import TradePanel from '../components/trading/TradePanel'
import ErrorBoundary from '../components/ErrorBoundary'


const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
]

export default function Trade() {
  const [searchParams] = useSearchParams()
  const initialSymbol = searchParams.get('symbol') || 'BTCUSDT'

  const [markets, setMarkets] = useState<BinanceTicker[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol)
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBook, setOrderBook] = useState<BinanceOrderBook | null>(null)
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([])
  const [timeframe, setTimeframe] = useState('1m')

  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange24h, setPriceChange24h] = useState(0)
  const [high24h, setHigh24h] = useState(0)
  const [low24h, setLow24h] = useState(0)
  const [ma7, setMa7] = useState(0)
  const [ma14, setMa14] = useState(0)
  const [ma28, setMa28] = useState(0)

  // WS cleanup refs
  const tickerWsRef = useRef<{ close: () => void } | null>(null)
  const bookWsRef = useRef<{ close: () => void } | null>(null)
  const klineWsRef = useRef<{ close: () => void } | null>(null)

  // WS cleanup refs
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const tickers = await binanceService.getAllTickers()
        setMarkets(tickers.slice(0, 80))
      } catch (e) {
        console.error('Failed to fetch markets:', e)
      }
    }
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 30_000) // refresh list every 30 s
    return () => clearInterval(interval)
  }, [])

  /* ── Calculate MAs from candle data ────────────────────────── */
  const calcMAs = useCallback((data: CandlestickData[]) => {
    const ma = (period: number) => {
      if (data.length < period) return 0
      let sum = 0
      for (let i = data.length - period; i < data.length; i++) sum += data[i].close
      return sum / period
    }
    setMa7(ma(7))
    setMa14(ma(14))
    setMa28(ma(28))
  }, [])

  /* ── Initial REST load for candles + ticker ─────────────────── */
  const loadInitialData = useCallback(async (symbol: string, tf: string) => {
    try {
      const [ticker, candles] = await Promise.all([
        binanceService.getTicker(symbol),
        binanceService.getCandlesticks(symbol, tf, 500),
      ])
      setCurrentPrice(parseFloat(ticker.price))
      setPriceChange24h(parseFloat(ticker.priceChangePercent))
      setHigh24h(parseFloat(ticker.highPrice))
      setLow24h(parseFloat(ticker.lowPrice))
      setCandlestickData(candles)
      calcMAs(candles)
    } catch (e) {
      console.error('Initial data load failed:', e)
    }
  }, [calcMAs])

  /* ── Wire up WebSocket streams ──────────────────────────────── */
  useEffect(() => {
    // Close previous streams
    tickerWsRef.current?.close()
    bookWsRef.current?.close()
    klineWsRef.current?.close()

    // Load initial snapshot via REST
    loadInitialData(selectedSymbol, timeframe)

    // 1. Ticker stream → live price
    tickerWsRef.current = subscribeTicker(selectedSymbol, (t) => {
      setCurrentPrice(parseFloat(t.price))
      setPriceChange24h(parseFloat(t.priceChangePercent))
      setHigh24h(parseFloat(t.highPrice))
      setLow24h(parseFloat(t.lowPrice))
    })

    // 2. Order book stream
    bookWsRef.current = subscribeOrderBook(selectedSymbol, (book) => {
      setOrderBook(book)
    }, 20)

    // 3. Kline stream → live candle updates
    klineWsRef.current = subscribeKline(selectedSymbol, timeframe, (candle, isFinal) => {
      setCandlestickData(prev => {
        if (prev.length === 0) return prev
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.time === candle.time) {
          // Update the current unclosed candle
          updated[updated.length - 1] = candle
        } else if (isFinal) {
          // New closed candle; append and trim to 500
          updated.push(candle)
          if (updated.length > 500) updated.shift()
        }
        calcMAs(updated)
        return updated
      })
    })

    return () => {
      tickerWsRef.current?.close()
      bookWsRef.current?.close()
      klineWsRef.current?.close()
    }
  }, [selectedSymbol, timeframe, loadInitialData, calcMAs])

  const formatPrice = (price: number) =>
    price >= 1
      ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toFixed(6)

  return (
    <div className="min-h-screen lg:h-screen bg-gray-950 text-white flex flex-col overflow-x-hidden lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 overflow-x-hidden lg:overflow-hidden">

        {/* ── Market List Panel ─────────────────────────────────── */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 border-b border-gray-800 lg:border-b-0 lg:border-r flex flex-col h-[300px] lg:h-full">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <MarketList
              markets={markets}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* ── Center: Price header + Chart ─────────────────────── */}
        <div className="flex-1 flex flex-col overflow-x-hidden lg:overflow-hidden border-b lg:border-b-0 border-gray-800">

          {/* Price header */}
          <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-gray-800 bg-gray-950 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Symbol + price */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  {selectedSymbol.replace('USDT', '')} / USDT
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-3xl md:text-4xl font-extrabold text-white tabular-nums"
                    style={{ fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px rgba(34,211,238,0.2)' }}
                  >
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-sm text-gray-500 font-mono">USD</span>
                  <span
                    className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${priceChange24h >= 0
                      ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                      : 'text-red-400 bg-red-500/10 border border-red-500/20'
                      }`}
                  >
                    {priceChange24h >= 0 ? '↑' : '↓'} {priceChange24h >= 0 ? '+' : ''}
                    {priceChange24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 24 h stats */}
              <div className="flex gap-5 text-sm border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0">
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wider">24h High</p>
                  <p className="text-green-400 font-semibold tabular-nums">{formatPrice(high24h)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wider">24h Low</p>
                  <p className="text-red-400 font-semibold tabular-nums">{formatPrice(low24h)}</p>
                </div>
              </div>
            </div>

            {/* Timeframe + MA indicators */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${timeframe === tf.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                      }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 text-[10px] font-mono">
                {[
                  { label: 'MA7', val: ma7, color: 'text-yellow-400' },
                  { label: 'MA14', val: ma14, color: 'text-blue-400' },
                  { label: 'MA28', val: ma28, color: 'text-purple-400' },
                ].map(m => (
                  <div key={m.label} className="whitespace-nowrap px-2 py-1 rounded-md bg-gray-800/30 border border-gray-700/30">
                    <span className="text-gray-500">{m.label}: </span>
                    <span className={m.color}>{formatPrice(m.val)}</span>
                  </div>
                ))}
                <div className="whitespace-nowrap px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-cyan-600">●</span>
                  <span className="text-cyan-400 ml-1">Live via WebSocket</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 bg-gray-950 min-h-[300px] lg:min-h-0 relative">
            <div className="absolute inset-0">
              {candlestickData.length > 0 ? (
                <ErrorBoundary name="CandlestickChart">
                  <CandlestickChart
                    data={candlestickData}
                  />
                </ErrorBoundary>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                  <div className="w-8 h-8 border-2 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="text-sm">Loading chart…</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Order Book + Trade Form ─────────────── */}
        <div className="w-full lg:w-96 lg:flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-800 lg:h-screen overflow-y-auto custom-scrollbar">
          <div className="flex flex-col sm:flex-row lg:flex-col flex-1 divide-y sm:divide-y-0 lg:divide-y divide-gray-800">

            {/* Order Book */}
            <div className="flex-1 h-[350px] sm:h-[450px] lg:h-2/5 overflow-hidden border-b sm:border-b-0 sm:border-r lg:border-r-0 border-gray-800">
              <OrderBook
                orderBook={orderBook}
                grouping="0.01"
                onGroupingChange={() => { }}
              />
            </div>

            {/* Trade Panel */}
            <div className="flex-1 p-4 min-h-[500px]">
              <TradePanel
                key={selectedSymbol}
                symbol={selectedSymbol}
                currentPrice={currentPrice}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
