import { useState, useEffect, useRef } from 'react'
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
  const [markets, setMarkets] = useState<BinanceTicker[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
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
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Main Content Area - Full height container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Markets List */}
        {/* 
          Left panel: Fixed width, matches center height, independently scrollable
          Height is constrained by parent flex container (h-screen)
        */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 border-b border-gray-800 lg:border-b-0 lg:border-r flex flex-col overflow-hidden">
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

        {/* Center + Right Panels - Flex container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Center Panel - Chart and Price Info */}
          {/* 
            Center panel: Determines the height for left/right panels
            Uses flex-1 to take available space
          */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Price Display Header - Enhanced with neon design */}
            <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-900 relative overflow-hidden">
              {/* Subtle background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 mb-2">
                      <h1 
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                        style={{
                          textShadow: '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.1)',
                        }}
                      >
                        {formatPrice(currentPrice)}
                      </h1>
                      <span className="text-lg md:text-xl text-gray-500 font-mono">USD</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p
                        className={`text-sm md:text-base font-semibold px-3 py-1 rounded-lg ${
                          priceChange24h >= 0 
                            ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                            : 'text-red-400 bg-red-500/10 border border-red-500/20'
                        }`}
                        style={priceChange24h >= 0 ? {
                          boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)',
                        } : {
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {priceChange24h >= 0 ? '↑' : '↓'} {priceChange24h >= 0 ? '+' : ''}
                        {priceChange24h.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">24h</p>
                    </div>
                  </div>
                  
                  {/* 24h Stats - Enhanced design */}
                  <div className="flex gap-4 md:gap-6">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">24h High</div>
                      <div 
                        className="text-sm md:text-base text-green-400 font-semibold"
                        style={{
                          textShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
                        }}
                      >
                        {formatPrice(high24h)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">24h Low</div>
                      <div 
                        className="text-sm md:text-base text-red-400 font-semibold"
                        style={{
                          textShadow: '0 0 8px rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {formatPrice(low24h)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeframe Selection - Enhanced with glow */}
                <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value)}
                      className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all whitespace-nowrap relative ${
                        timeframe === tf.value
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                      }`}
                      style={timeframe === tf.value ? {
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.5), 0 0 30px rgba(34, 211, 238, 0.2)',
                      } : {}}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* Moving Averages - Enhanced design */}
                <div className="flex gap-4 md:gap-6 text-xs md:text-sm overflow-x-auto custom-scrollbar">
                  <div className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <span className="text-gray-400">MA7: </span>
                    <span 
                      className="text-yellow-400 font-semibold"
                      style={{
                        textShadow: '0 0 8px rgba(234, 179, 8, 0.4)',
                      }}
                    >
                      {formatPrice(ma7)}
                    </span>
                  </div>
                  <div className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <span className="text-gray-400">MA14: </span>
                    <span 
                      className="text-blue-400 font-semibold"
                      style={{
                        textShadow: '0 0 8px rgba(96, 165, 250, 0.4)',
                      }}
                    >
                      {formatPrice(ma14)}
                    </span>
                  </div>
                  <div className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-800/30 border border-gray-700/50">
                    <span className="text-gray-400">MA28: </span>
                    <span 
                      className="text-purple-400 font-semibold"
                      style={{
                        textShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                      }}
                    >
                      {formatPrice(ma28)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart - Takes remaining space, scrollable if needed */}
            <div className="flex-1 p-4 bg-gray-900 overflow-hidden">
              {candlestickData.length > 0 ? (
                <CandlestickChart data={candlestickData} height={400} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Loading chart...
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Order Book and Trading */}
          {/* 
            Right panel: Fixed width, matches center height, independently scrollable
            Split into two sections: OrderBook (scrollable) and TradePanel (scrollable)
          */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col border-t border-gray-800 lg:border-t-0 lg:border-l overflow-hidden">
            {/* Order Book - Scrollable section */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <OrderBook
                orderBook={orderBook}
                grouping={grouping}
                onGroupingChange={setGrouping}
              />
            </div>

            {/* Trading Interface - Scrollable section */}
            <div className="flex-1 overflow-hidden min-h-0 border-t border-gray-800">
              <TradePanel initialAsset={selectedSymbol.replace('USDT', '')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


