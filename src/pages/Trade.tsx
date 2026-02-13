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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Panel - Markets List */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 border-b border-gray-800 lg:border-b-0 lg:border-r">
          <MarketList
            markets={markets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Center + Right Panels */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Center Panel - Chart and Price Info */}
          <div className="flex-1 flex flex-col">
            {/* Price Display Header */}
            <div className="p-4 md:p-6 border-b border-gray-800 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                    {formatPrice(currentPrice)}
                  </h1>
                  <p className="text-gray-400 text-xs md:text-sm">
                    ≈{formatPrice(currentPrice)} USD
                  </p>
                  <p
                    className={`text-xs md:text-sm font-medium mt-1 ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {priceChange24h >= 0 ? '+' : ''}
                    {priceChange24h.toFixed(2)}% (24h)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs md:text-sm text-gray-400 mb-1">24h High</div>
                  <div className="text-sm md:text-base text-white font-semibold">{formatPrice(high24h)}</div>
                  <div className="text-xs md:text-sm text-gray-400 mb-1 mt-2">24h Low</div>
                  <div className="text-sm md:text-base text-white font-semibold">{formatPrice(low24h)}</div>
                </div>
              </div>

              {/* Timeframe Selection */}
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${timeframe === tf.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Moving Averages */}
              <div className="flex gap-3 md:gap-6 text-xs md:text-sm overflow-x-auto scrollbar-hide">
                <div className="whitespace-nowrap">
                  <span className="text-gray-400">MA7: </span>
                  <span className="text-yellow-400 font-semibold">{formatPrice(ma7)}</span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="text-gray-400">MA14: </span>
                  <span className="text-blue-400 font-semibold">{formatPrice(ma14)}</span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="text-gray-400">MA28: </span>
                  <span className="text-purple-400 font-semibold">{formatPrice(ma28)}</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 p-4 bg-gray-900">
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
          <div className="w-full lg:w-80 lg:flex-shrink-0  flex flex-col border-t border-gray-800 lg:border-t-0 lg:border-l">
            {/* Order Book */}
            <div className="flex-1 max-h-content">
              <OrderBook
                orderBook={orderBook}
                grouping={grouping}
                onGroupingChange={setGrouping}
              />
            </div>

            {/* Trading Interface */}
            <div className="bg-gray-900 flex-1 mt-20 border-t border-gray-800" style={{ height: '500px' }}>
              <TradePanel initialAsset={selectedSymbol.replace('USDT', '')} />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


