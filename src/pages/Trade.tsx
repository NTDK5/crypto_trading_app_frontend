import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Clock, TrendingUp } from 'lucide-react'
import { tradeService, Trade as TradeType } from '../services/tradeService'
import { marketService, MarketData } from '../services/marketService'
import { walletService } from '../services/walletService'

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

  const fetchMarketData = async () => {
    try {
      const data = await marketService.getMarketData(selectedAsset)
      setMarketData(data)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    }
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
        // Check if trade expired
        const expiryTime = new Date(openTrade.expiryTime).getTime()
        if (Date.now() >= expiryTime) {
          // Trade expired, refresh to get updated status
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Binary Options Trading</h1>
        <p className="text-gray-400">Trade crypto with UP/DOWN predictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Selection */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Asset</h2>
            <div className="grid grid-cols-5 gap-3">
              {ASSETS.map((asset) => {
                const assetData = marketData
                const isSelected = selectedAsset === asset
                return (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-primary-600 border-primary-500 text-white'
                        : 'bg-dark-700 border-dark-600 text-gray-300 hover:border-primary-500'
                    }`}
                  >
                    <div className="text-sm font-medium">{asset.replace('USDT', '')}</div>
                    {assetData && (
                      <div className="text-xs mt-1 opacity-75">
                        ${assetData.price.toLocaleString()}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Trade Display */}
          {activeTrade && (
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Active Trade</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    activeTrade.status === 'WON'
                      ? 'bg-green-500/20 text-green-500'
                      : activeTrade.status === 'LOST'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  {activeTrade.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Asset</p>
                  <p className="text-lg font-semibold text-white">{activeTrade.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Direction</p>
                  <p
                    className={`text-lg font-semibold ${
                      activeTrade.direction === 'UP' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {activeTrade.direction === 'UP' ? (
                      <ArrowUp className="inline w-5 h-5" />
                    ) : (
                      <ArrowDown className="inline w-5 h-5" />
                    )}{' '}
                    {activeTrade.direction}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-lg font-semibold text-white">
                    {activeTrade.amount} USDT
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Entry Price</p>
                  <p className="text-lg font-semibold text-white">
                    ${activeTrade.entryPrice.toLocaleString()}
                  </p>
                </div>
                {activeTrade.exitPrice && (
                  <div>
                    <p className="text-sm text-gray-400">Exit Price</p>
                    <p className="text-lg font-semibold text-white">
                      ${activeTrade.exitPrice.toLocaleString()}
                    </p>
                  </div>
                )}
                {(activeTrade.status === 'OPEN' || activeTrade.status === 'PENDING') && (
                  <div>
                    <p className="text-sm text-gray-400">Time Remaining</p>
                    <p className="text-lg font-semibold text-yellow-500">
                      <Clock className="inline w-5 h-5 mr-1" />
                      {formatTime(timeRemaining)}
                    </p>
                  </div>
                )}
                {activeTrade.profit !== undefined && (
                  <div>
                    <p className="text-sm text-gray-400">Profit/Loss</p>
                    <p
                      className={`text-lg font-semibold ${
                        activeTrade.profit >= 0 ? 'text-green-500' : 'text-red-500'
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

          {/* Market Price Display */}
          {marketData && (
            <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{selectedAsset}</p>
                  <p className="text-3xl font-bold text-white">
                    ${marketData.price.toLocaleString()}
                  </p>
                  <p
                    className={`text-sm font-medium mt-1 ${
                      marketData.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {marketData.change24h >= 0 ? '+' : ''}
                    {marketData.change24h.toFixed(2)}% (24h)
                  </p>
                </div>
                <TrendingUp className="w-16 h-16 text-primary-500 opacity-20" />
              </div>
            </div>
          )}

          {/* Direction Selection */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Direction</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedDirection('UP')}
                disabled={!!activeTrade || loading}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedDirection === 'UP'
                    ? 'bg-green-500/20 border-green-500 text-green-500'
                    : 'bg-dark-700 border-dark-600 text-gray-300 hover:border-green-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowUp className="w-12 h-12 mx-auto mb-2" />
                <div className="text-xl font-bold">UP</div>
                <div className="text-sm mt-1">Price will go up</div>
              </button>
              <button
                onClick={() => setSelectedDirection('DOWN')}
                disabled={!!activeTrade || loading}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedDirection === 'DOWN'
                    ? 'bg-red-500/20 border-red-500 text-red-500'
                    : 'bg-dark-700 border-dark-600 text-gray-300 hover:border-red-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowDown className="w-12 h-12 mx-auto mb-2" />
                <div className="text-xl font-bold">DOWN</div>
                <div className="text-sm mt-1">Price will go down</div>
              </button>
            </div>
          </div>

          {/* Amount and Duration */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!!activeTrade || loading}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Available: {balance.toFixed(2)} USDT
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      disabled={!!activeTrade || loading}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        duration === dur
                          ? 'bg-primary-600 border-primary-500 text-white'
                          : 'bg-dark-700 border-dark-600 text-gray-300 hover:border-primary-500'
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
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Place Trade Button */}
          <button
            onClick={handleTrade}
            disabled={!!activeTrade || loading || !selectedDirection}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Placing Trade...' : activeTrade ? 'Trade in Progress' : 'Place Trade'}
          </button>
        </div>

        {/* Sidebar - Trade Info */}
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Trade Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Asset:</span>
                <span className="text-white font-medium">{selectedAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Direction:</span>
                <span className="text-white font-medium">
                  {selectedDirection || 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">{amount} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white font-medium">{duration} seconds</span>
              </div>
              <div className="pt-3 border-t border-dark-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Potential Profit:</span>
                  <span className="text-green-500 font-semibold">
                    +{((parseFloat(amount) || 0) * 0.15).toFixed(2)} USDT (15%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Select an asset and predict if price goes UP or DOWN
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Choose your investment amount and duration
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                If correct, earn 15% profit on your investment
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                Trades settle automatically when timer expires
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

