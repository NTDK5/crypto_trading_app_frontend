import { useState, useEffect, useRef } from 'react'
import { binanceService, BinanceTicker, BinanceOrderBook, CandlestickData } from '../services/binanceService'
import MarketList from '../components/MarketList'
import OrderBook from '../components/OrderBook'
import CandlestickChart from '../components/CandlestickChart'
import TradeModal from '../components/TradeModal'
import { tradeService, Trade as TradeType } from '../services/tradeService'

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
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [activeTrade, setActiveTrade] = useState<TradeType | null>(null)
  const [ma7, setMa7] = useState(0)
  const [ma14, setMa14] = useState(0)
  const [ma28, setMa28] = useState(0)

  // Polling intervals
  const marketDataIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const orderBookIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const candlestickIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Check for active trades
  useEffect(() => {
    fetchActiveTrade()
    const tradeInterval = setInterval(() => {
      fetchActiveTrade()
    }, 2000)
    return () => clearInterval(tradeInterval)
  }, [])

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

  const fetchActiveTrade = async () => {
    try {
      const trades = await tradeService.getUserTrades()
      const openTrade = trades.find(
        (t) => t.status === 'OPEN' || t.status === 'PENDING'
      )
      setActiveTrade(openTrade || null)
    } catch (error) {
      console.error('Failed to fetch active trade:', error)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(8)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`
    }
    return volume.toFixed(2)
  }

  const selectedMarket = markets.find((m) => m.symbol === selectedSymbol)

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Markets List */}
        <div className="w-80 flex-shrink-0">
          <MarketList
            markets={markets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Center Panel - Chart and Price Info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Price Display Header */}
          <div className="p-6 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  {formatPrice(currentPrice)}
                </h1>
                <p className="text-gray-400 text-sm">
                  ≈{formatPrice(currentPrice)} USD
                </p>
                <p
                  className={`text-sm font-medium mt-1 ${
                    priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {priceChange24h >= 0 ? '+' : ''}
                  {priceChange24h.toFixed(2)}% (24h)
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">24h High</div>
                <div className="text-white font-semibold">{formatPrice(high24h)}</div>
                <div className="text-sm text-gray-400 mb-1 mt-2">24h Low</div>
                <div className="text-white font-semibold">{formatPrice(low24h)}</div>
              </div>
            </div>

            {/* Timeframe Selection */}
            <div className="flex gap-2 mb-4">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeframe === tf.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Moving Averages */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-400">MA7: </span>
                <span className="text-yellow-400 font-semibold">{formatPrice(ma7)}</span>
              </div>
              <div>
                <span className="text-gray-400">MA14: </span>
                <span className="text-blue-400 font-semibold">{formatPrice(ma14)}</span>
              </div>
              <div>
                <span className="text-gray-400">MA28: </span>
                <span className="text-purple-400 font-semibold">{formatPrice(ma28)}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 p-4 bg-gray-900">
            {candlestickData.length > 0 ? (
              <CandlestickChart data={candlestickData} height={500} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading chart...
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Order Book and Trading */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-800">
          {/* Order Book */}
          <div className="flex-1 overflow-hidden">
            <OrderBook
              orderBook={orderBook}
              grouping={grouping}
              onGroupingChange={setGrouping}
            />
          </div>

          {/* Trading Interface */}
          <div className="p-4 bg-gray-900 border-t border-gray-800">
            <div className="flex gap-2 mb-4 border-b border-gray-700">
              {['Market', 'Limit', 'Stop', 'Stop Limit'].map((type) => (
                <button
                  key={type}
                  className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Buy
                </button>
                <button
                  onClick={() => setIsTradeModalOpen(true)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Sell
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300 hover:bg-gray-700"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Fee</span>
                  <span className="text-gray-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available Balance</span>
                  <span className="text-gray-400">$0.00</span>
                </div>
              </div>

              <button
                onClick={() => setIsTradeModalOpen(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Buy {selectedSymbol.replace('USDT', '')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        selectedAsset={selectedSymbol}
        currentPrice={currentPrice}
        onTradeSuccess={fetchActiveTrade}
      />
    </div>
  )
}
