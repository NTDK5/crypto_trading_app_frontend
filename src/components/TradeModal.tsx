import { useState, useEffect } from 'react'
import { X, ArrowUp, ArrowDown } from 'lucide-react'
import { tradeService} from '../services/tradeService'
import { walletService } from '../services/walletService'

const DURATIONS = [30, 60, 120, 300] // seconds

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAsset: string
  currentPrice: number
  onTradeSuccess?: () => void
}

export default function TradeModal({
  isOpen,
  onClose,
  selectedAsset,
  onTradeSuccess,
}: TradeModalProps) {
  const [selectedDirection, setSelectedDirection] = useState<'UP' | 'DOWN' | null>(null)
  const [amount, setAmount] = useState('10')
  const [duration, setDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [balance, setBalance] = useState(0)
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop' | 'Stop Limit'>('Market')

  useEffect(() => {
    if (isOpen) {
      fetchBalance()
    }
  }, [isOpen])

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
      await tradeService.createTrade({
        asset: selectedAsset,
        direction: selectedDirection,
        amount: tradeAmount,
        duration,
      })
      setSuccess('Trade placed successfully!')
      setTimeout(() => {
        onClose()
        if (onTradeSuccess) {
          onTradeSuccess()
        }
        // Reset form
        setSelectedDirection(null)
        setAmount('10')
        setDuration(60)
        setError('')
        setSuccess('')
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place trade')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(6)
  }

  const handleAmountPercent = (percent: number) => {
    const percentAmount = (balance * percent) / 100
    setAmount(percentAmount.toFixed(2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Place Trade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Type Tabs */}
          <div className="flex gap-2 border-b border-gray-700">
            {(['Market', 'Limit', 'Stop', 'Stop Limit'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  orderType === type
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedDirection('UP')}
                disabled={loading}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedDirection === 'UP'
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500 text-green-400'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-green-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowUp className="w-8 h-8 mx-auto mb-2" />
                <div className="text-lg font-bold">UP</div>
              </button>
              <button
                onClick={() => setSelectedDirection('DOWN')}
                disabled={loading}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedDirection === 'DOWN'
                    ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500 text-red-400'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-red-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowDown className="w-8 h-8 mx-auto mb-2" />
                <div className="text-lg font-bold">DOWN</div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Quantity
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
              placeholder="0.00"
            />
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleAmountPercent(percent)}
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  {percent}%
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Available: <span className="text-cyan-400 font-semibold">{balance.toFixed(2)} USDT</span>
            </p>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl border transition-all duration-300 font-semibold text-sm ${
                    duration === dur
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-500 text-white'
                      : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-cyan-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-semibold">${formatPrice(parseFloat(amount) || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estimated Fee</span>
              <span className="text-gray-400">$0.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Available Balance</span>
              <span className="text-gray-400">${balance.toFixed(2)}</span>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTrade}
              disabled={loading || !selectedDirection}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Trade...' : `Buy ${selectedAsset.replace('USDT', '')}`}
            </button>
            <button
              onClick={handleTrade}
              disabled={loading || !selectedDirection}
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Trade...' : `Sell ${selectedAsset.replace('USDT', '')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

