import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Clock, TrendingUp, Zap } from 'lucide-react'
import { tradeService, Trade as TradeType } from '../services/tradeService'
import { marketService, MarketData } from '../services/marketService'
import { walletService } from '../services/walletService'
import TradingChart from '../components/TradingChart'

const ASSETS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT']
const DURATIONS = [30, 60, 120, 300] // seconds

export default function Trade() {
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT')
  const [selectedDirection, setSelectedDirection] = useState<'UP' | 'DOWN' | null>(null)
  const [amount, setAmount] = useState('10')
  const [duration, setDuration] = useState(60)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTrade, setActiveTrade] = useState<TradeType | null>(null)
  const [balance, setBalance] = useState(0)
  const [chartData, setChartData] = useState<Array<{ time: number; value: number }>>([])

  useEffect(() => {
    fetchMarketData()
    fetchBalance()
    fetchActiveTrade()

    const interval = setInterval(() => {
      fetchMarketData()
      if (activeTrade) {
        fetchActiveTrade()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [selectedAsset, activeTrade])

  useEffect(() => {
    if (marketData) {
      generateChartData()
    }
  }, [marketData, selectedAsset])

  const fetchMarketData = async () => {
    try {
      const data = await marketService.getMarketData(selectedAsset)
      setMarketData(data)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    }
  }

  const generateChartData = () => {
    if (!marketData) return
    const data: Array<{ time: number; value: number }> = []
    const basePrice = marketData.price
    const now = Math.floor(Date.now() / 1000)
    for (let i = 60; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * (basePrice * 0.02)
      data.push({
        time: now - (i * 60),
        value: basePrice + variance,
      })
    }
    setChartData(data)
  }

  const fetchBalance = async () => {
    try {
      const balances = await walletService.getBalances()
      if (Array.isArray(balances)) {
        const usdtBalance = balances.find((b) => b.asset === 'USDT')
        setBalance(usdtBalance?.available || 0)
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const fetchActiveTrade = async () => {
    try {
      const trades = await tradeService.getUserTrades()
      const openTrade = trades.find(
        (t) => t.status === 'OPEN' || t.status === 'PENDING'
      )
      if (openTrade) {
        setActiveTrade(openTrade)
        const expiryTime = new Date(openTrade.expiryTime).getTime()
        if (Date.now() >= expiryTime) {
          setTimeout(() => {
            fetchActiveTrade()
          }, 1000)
        }
      } else {
        setActiveTrade(null)
      }
    } catch (error) {
      console.error('Failed to fetch active trade:', error)
    }
  }

  const handleTrade = async () => {
    if (!selectedDirection) {
      setError('Please select a direction (UP or DOWN)')
      return
    }

    const tradeAmount = parseFloat(amount)
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (tradeAmount > balance) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const trade = await tradeService.createTrade({
        asset: selectedAsset,
        direction: selectedDirection,
        amount: tradeAmount,
        duration,
      })
      setActiveTrade(trade)
      setSuccess('Trade placed successfully!')
      fetchBalance()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place trade')
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (expiryTime: string) => {
    const expiry = new Date(expiryTime).getTime()
    const now = Date.now()
    const diff = Math.max(0, expiry - now)
    const seconds = Math.floor(diff / 1000)
    return seconds
  }

  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    if (activeTrade) {
      setTimeRemaining(getTimeRemaining(activeTrade.expiryTime))
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(activeTrade.expiryTime)
        setTimeRemaining(remaining)
        if (remaining === 0) {
          fetchActiveTrade()
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTrade])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(6)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Binary Options Trading
          </h1>
          <p className="text-gray-400 text-lg">Trade crypto with UP/DOWN predictions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Price Display with Chart */}
            {marketData && (
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">{selectedAsset}</p>
                    <p className="text-3xl font-bold text-white">
                      ${formatPrice(marketData.price)}
                    </p>
                    <p
                      className={`text-sm font-medium mt-1 ${
                        marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {marketData.change24h >= 0 ? '+' : ''}
                      {marketData.change24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50 mt-4">
                  <TradingChart 
                    data={chartData} 
                    color={marketData.change24h >= 0 ? '#10b981' : '#ef4444'}
                    height={250}
                  />
                </div>
              </div>
            )}

            {/* Asset Selection */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-cyan-400" />
                Select Asset
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {ASSETS.map((asset) => {
                  const isSelected = selectedAsset === asset
                  return (
                    <button
                      key={asset}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-cyan-500/50 hover:bg-gray-800/80'
                      }`}
                    >
                      <div className="text-sm font-medium">{asset.replace('USDT', '')}</div>
                      {marketData && (
                        <div className="text-xs mt-1 opacity-75">
                          ${formatPrice(marketData.price)}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Trade Display */}
            {activeTrade && (
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Active Trade</h2>
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-semibold ${
                      activeTrade.status === 'WON'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : activeTrade.status === 'LOST'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {activeTrade.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Asset</p>
                    <p className="text-lg font-semibold text-white">{activeTrade.asset}</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Direction</p>
                    <p
                      className={`text-lg font-semibold flex items-center ${
                        activeTrade.direction === 'UP' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {activeTrade.direction === 'UP' ? (
                        <ArrowUp className="inline w-5 h-5 mr-1" />
                      ) : (
                        <ArrowDown className="inline w-5 h-5 mr-1" />
                      )}
                      {activeTrade.direction}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Amount</p>
                    <p className="text-lg font-semibold text-white">
                      {activeTrade.amount} USDT
                    </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Entry Price</p>
                    <p className="text-lg font-semibold text-white">
                      ${formatPrice(activeTrade.entryPrice)}
                    </p>
                  </div>
                  {activeTrade.exitPrice && (
                    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Exit Price</p>
                      <p className="text-lg font-semibold text-white">
                        ${formatPrice(activeTrade.exitPrice)}
                      </p>
                    </div>
                  )}
                  {(activeTrade.status === 'OPEN' || activeTrade.status === 'PENDING') && (
                    <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <p className="text-sm text-gray-400 mb-1">Time Remaining</p>
                      <p className="text-lg font-semibold text-yellow-400 flex items-center">
                        <Clock className="inline w-5 h-5 mr-2" />
                        {formatTime(timeRemaining)}
                      </p>
                    </div>
                  )}
                  {activeTrade.profit !== undefined && (
                    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Profit/Loss</p>
                      <p
                        className={`text-lg font-semibold ${
                          activeTrade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {activeTrade.profit >= 0 ? '+' : ''}
                        {activeTrade.profit.toFixed(2)} USDT
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direction Selection */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Select Direction</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedDirection('UP')}
                  disabled={!!activeTrade || loading}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 group ${
                    selectedDirection === 'UP'
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/20'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-green-500/50 hover:bg-gray-800/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowUp className="w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-bold">UP</div>
                  <div className="text-sm mt-2 opacity-75">Price will go up</div>
                </button>
                <button
                  onClick={() => setSelectedDirection('DOWN')}
                  disabled={!!activeTrade || loading}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 group ${
                    selectedDirection === 'DOWN'
                      ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/20'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-red-500/50 hover:bg-gray-800/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowDown className="w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-bold">DOWN</div>
                  <div className="text-sm mt-2 opacity-75">Price will go down</div>
                </button>
              </div>
            </div>

            {/* Amount and Duration */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!!activeTrade || loading}
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 transition-all"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Available: <span className="text-cyan-400 font-semibold">{balance.toFixed(2)} USDT</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {DURATIONS.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setDuration(dur)}
                        disabled={!!activeTrade || loading}
                        className={`px-4 py-3 rounded-xl border transition-all duration-300 font-semibold ${
                          duration === dur
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-cyan-500/50 hover:bg-gray-800/80'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl backdrop-blur-sm">
                {success}
              </div>
            )}

            {/* Place Trade Button */}
            <button
              onClick={handleTrade}
              disabled={!!activeTrade || loading || !selectedDirection}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]"
            >
              {loading ? 'Placing Trade...' : activeTrade ? 'Trade in Progress' : 'Place Trade'}
            </button>
          </div>

          {/* Sidebar - Trade Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
                Trade Summary
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white font-semibold">{selectedAsset}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                  <span className="text-gray-400">Direction:</span>
                  <span className="text-white font-semibold">
                    {selectedDirection || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">{amount} USDT</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-semibold">{duration} seconds</span>
                </div>
                <div className="pt-4 border-t border-gray-700/50">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30">
                    <span className="text-gray-400">Potential Profit:</span>
                    <span className="text-green-400 font-bold">
                      +{((parseFloat(amount) || 0) * 0.15).toFixed(2)} USDT (15%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
                How It Works
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 mt-1">•</span>
                  <span>Select an asset and predict if price goes UP or DOWN</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 mt-1">•</span>
                  <span>Choose your investment amount and duration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 mt-1">•</span>
                  <span>If correct, earn 15% profit on your investment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 mt-1">•</span>
                  <span>Trades settle automatically when timer expires</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
