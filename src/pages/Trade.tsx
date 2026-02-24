import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { binanceService, BinanceTicker, BinanceOrderBook, CandlestickData } from '../services/binanceService'
import MarketList from '../components/MarketList'
import OrderBook from '../components/OrderBook'
import CandlestickChart from '../components/CandlestickChart'
import TradePanel from '../components/trading/TradePanel'

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
  const [grouping, setGrouping] = useState('0.01')
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([])
  const [timeframe, setTimeframe] = useState('1m')
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange24h, setPriceChange24h] = useState(0)
  const [high24h, setHigh24h] = useState(0)
  const [low24h, setLow24h] = useState(0)

  const [ma7, setMa7] = useState(0)
  const [ma14, setMa14] = useState(0)
  const [ma28, setMa28] = useState(0)

  // Polling intervals
  const marketDataIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const orderBookIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const candlestickIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch all markets on mount
  useEffect(() => {
    fetchAllMarkets()
  }, [])

  // Fetch market data, order book, and candlesticks when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      fetchMarketData()
      fetchOrderBook()
      fetchCandlesticks()

      // Set up continuous polling
      marketDataIntervalRef.current = setInterval(() => {
        fetchMarketData()
      }, 2000) // Poll every 2 seconds

      orderBookIntervalRef.current = setInterval(() => {
        fetchOrderBook()
      }, 1000) // Poll every 1 second

      candlestickIntervalRef.current = setInterval(() => {
        fetchCandlesticks()
      }, 5000) // Poll every 5 seconds
    }

    return () => {
      if (marketDataIntervalRef.current) clearInterval(marketDataIntervalRef.current)
      if (orderBookIntervalRef.current) clearInterval(orderBookIntervalRef.current)
      if (candlestickIntervalRef.current) clearInterval(candlestickIntervalRef.current)
    }
  }, [selectedSymbol, timeframe])



  const fetchAllMarkets = async () => {
    try {
      const tickers = await binanceService.getAllTickers()
      setMarkets(tickers.slice(0, 50)) // Limit to top 50 for performance
    } catch (error) {
      console.error('Failed to fetch markets:', error)
    }
  }

  const fetchMarketData = async () => {
    try {
      const ticker = await binanceService.getTicker(selectedSymbol)
      setCurrentPrice(parseFloat(ticker.price))
      setPriceChange24h(parseFloat(ticker.priceChangePercent))
      setHigh24h(parseFloat(ticker.highPrice))
      setLow24h(parseFloat(ticker.lowPrice))
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    }
  }

  const fetchOrderBook = async () => {
    try {
      const book = await binanceService.getOrderBook(selectedSymbol, 20)
      setOrderBook(book)
    } catch (error) {
      console.error('Failed to fetch order book:', error)
    }
  }

  const fetchCandlesticks = async () => {
    try {
      const data = await binanceService.getCandlesticks(selectedSymbol, timeframe, 500)
      setCandlestickData(data)

      // Calculate moving averages
      if (data.length > 0) {
        const calculateMA = (period: number) => {
          if (data.length < period) return 0
          let sum = 0
          for (let i = data.length - period; i < data.length; i++) {
            sum += data[i].close
          }
          return sum / period
        }

        setMa7(calculateMA(7))
        setMa14(calculateMA(14))
        setMa28(calculateMA(28))
      }
    } catch (error) {
      console.error('Failed to fetch candlesticks:', error)
    }
  }



  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(8)
  }

  // const formatVolume = (volume: number) => {
  //   if (volume >= 1000000) {
  //     return `${(volume / 1000000).toFixed(2)}M`
  //   }
  //   if (volume >= 1000) {
  //     return `${(volume / 1000).toFixed(2)}K`
  //   }
  //   return volume.toFixed(2)
  // }

  // const selectedMarket = markets.find((m) => m.symbol === selectedSymbol)

  return (
    <div className="min-h-screen lg:h-screen bg-gray-900 text-white flex flex-col overflow-x-hidden lg:overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-x-hidden lg:overflow-hidden">
        {/* Market List Panel */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 border-b border-gray-800 lg:border-b-0 lg:border-r flex flex-col h-[300px] lg:h-full">
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

        {/* Center Content: Chart and Price Info */}
        <div className="flex-1 flex flex-col overflow-x-hidden lg:overflow-hidden border-b lg:border-b-0 border-gray-800">
          {/* Price Display Header */}
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h1
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                      style={{
                        textShadow: '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.1)',
                      }}
                    >
                      {formatPrice(currentPrice)}
                    </h1>
                    <span className="text-sm sm:text-lg md:text-xl text-gray-500 font-mono">USD</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={`text-xs sm:text-sm md:text-base font-semibold px-2 py-1 rounded-lg ${priceChange24h >= 0
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                        : 'text-red-400 bg-red-500/10 border border-red-500/20'
                        }`}
                    >
                      {priceChange24h >= 0 ? '↑' : '↓'} {priceChange24h >= 0 ? '+' : ''}
                      {priceChange24h.toFixed(2)}%
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">24h Change</p>
                  </div>
                </div>

                {/* 24h Stats */}
                <div className="flex gap-4 sm:gap-6 border-t sm:border-t-0 border-gray-800 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-gray-500 mb-1">24h High</div>
                    <div className="text-xs sm:text-sm md:text-base text-green-400 font-semibold">
                      {formatPrice(high24h)}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-gray-500 mb-1">24h Low</div>
                    <div className="text-xs sm:text-sm md:text-base text-red-400 font-semibold">
                      {formatPrice(low24h)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeframe and Indicators Toggles */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${timeframe === tf.value
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1 text-[10px] sm:text-xs">
                  <div className="whitespace-nowrap px-2 py-1 rounded-md bg-gray-800/30 border border-gray-700/30">
                    <span className="text-gray-400">MA7: </span>
                    <span className="text-yellow-400">{formatPrice(ma7)}</span>
                  </div>
                  <div className="whitespace-nowrap px-2 py-1 rounded-md bg-gray-800/30 border border-gray-700/30">
                    <span className="text-gray-400">MA14: </span>
                    <span className="text-blue-400">{formatPrice(ma14)}</span>
                  </div>
                  <div className="whitespace-nowrap px-2 py-1 rounded-md bg-gray-800/30 border border-gray-700/30">
                    <span className="text-gray-400">MA28: </span>
                    <span className="text-purple-400">{formatPrice(ma28)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="flex-1 bg-gray-900 min-h-[300px] lg:min-h-0 relative">
            <div className="absolute inset-0 overflow-hidden">
              {candlestickData.length > 0 ? (
                <CandlestickChart data={candlestickData} height={document.querySelector('.flex-1.bg-gray-900')?.clientHeight || 400} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Loading chart...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Order Book and Trade Form */}
        <div className="w-full lg:w-96 lg:flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-800 lg:h-screen overflow-y-auto custom-scrollbar">
          <div className="flex flex-col sm:flex-row lg:flex-col flex-1 divide-y sm:divide-y-0 lg:divide-y divide-gray-800">
            {/* Order Book */}
            <div className="flex-1 h-[400px] sm:h-[500px] lg:h-1/2 overflow-hidden border-b sm:border-b-0 sm:border-r lg:border-r-0 border-gray-800">
              <OrderBook
                orderBook={orderBook}
                grouping={grouping}
                onGroupingChange={setGrouping}
              />
            </div>

            {/* Trading Interface */}
            <div className="flex-1 min-h-[450px]  custom-scrollbar">
              <div className="p-4">
                <TradePanel key={selectedSymbol} symbol={selectedSymbol} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


