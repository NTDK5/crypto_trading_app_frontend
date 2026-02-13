import { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowRight, RefreshCw, Settings, Eye, EyeOff, MessageCircle, ChevronRight, Repeat, User } from 'lucide-react'
import { walletService, WalletBalance } from '../services/walletService'
import { useAuth } from '../contexts/AuthContext'
import TransactionHistory from '../components/dashboard/TransactionHistory'
import Portfolio from '../components/dashboard/Portfolio'

export default function Wallet() {
  const { user } = useAuth()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawFundPassword, setWithdrawFundPassword] = useState('')
  const [showWithdrawFundPassword, setShowWithdrawFundPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [_paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Calculate totals
  const totalAssetsUSD = balances.reduce((sum, b) => sum + (b.balance || 0), 0)
  const totalAssetsBTC = totalAssetsUSD / 50000 // Approximate BTC price
  const availableBalance = balances.reduce((sum, b) => sum + (b.available || 0), 0)
  const inUseBalance = balances.reduce((sum, b) => sum + (b.locked || 0), 0)

  // Calculate today's P&L (placeholder - you can replace with actual calculation)
  const todayPnL = 0.04
  const todayPnLPercent = 0.02

  // Generate user ID from user.id (first 8 characters)
  const userId = user?.id ? user.id.substring(0, 8).toUpperCase() : 'N/A'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const balancesData = await walletService.getBalances()
      setBalances(balancesData)
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await walletService.deposit({
        asset: 'USDT',
        amount: parseFloat(depositAmount),
      })
      setMessage({ type: 'success', text: 'Deposit request submitted successfully!' })
      setDepositAmount('')
      setPaymentScreenshot(null)
      setScreenshotPreview(null)
      setShowDeposit(false)
      fetchData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit deposit request',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!withdrawFundPassword) {
      setMessage({ type: 'error', text: 'Fund password is required for withdrawals' })
      setLoading(false)
      return
    }

    try {
      await walletService.withdraw({
        asset: 'USDT',
        amount: parseFloat(withdrawAmount),
        address: withdrawAddress,
        fundPassword: withdrawFundPassword,
      })
      setMessage({ type: 'success', text: 'Withdrawal request submitted successfully!' })
      setWithdrawAmount('')
      setWithdrawAddress('')
      setWithdrawFundPassword('')
      setShowWithdraw(false)
      fetchData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit withdrawal request',
      })
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Assets
              </h1>
              <p className="text-gray-400 text-lg">Manage your wallet, deposits, and withdrawals</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-sm">{userId}</p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}
          >
            {message.text}
          </div>
        )}

        {/* Assets Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Assets</h2>

          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Total Assets</p>
              <p className="text-4xl font-bold text-white mb-1">
                {balanceVisible ? `${totalAssetsUSD.toFixed(2)} USD` : '••••••'}
              </p>
              <p className="text-gray-400 text-sm">
                ≈ {balanceVisible ? totalAssetsBTC.toFixed(8) : '••••••'} BTC
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2 text-green-400 cursor-pointer hover:text-green-300">
                <span className="text-lg font-semibold">
                  {balanceVisible ? `+${todayPnL.toFixed(2)} USD (${todayPnLPercent > 0 ? '+' : ''}${todayPnLPercent.toFixed(2)}%)` : '••••••'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="text-sm text-gray-400">Today's P&L</div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Available</p>
                <p className="text-2xl font-bold text-white mb-1">
                  {balanceVisible ? `${availableBalance.toFixed(2)} USD` : '••••••'}
                </p>
                <p className="text-gray-500 text-xs">Can trade & withdraw</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">In Use</p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {balanceVisible ? `${inUseBalance.toFixed(2)} USD` : '••••••'}
                  </p>
                  <p className="text-gray-500 text-xs">USD balance from deposits</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center space-x-6 mb-8">
          <button
            onClick={() => setShowDeposit(true)}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
              <ArrowDownLeft className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-300 text-sm">Deposit</span>
          </button>

          <button
            onClick={() => setShowWithdraw(true)}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-300 text-sm">Withdraw</span>
          </button>

          <button
            onClick={() => setShowTransfer(true)}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
              <Repeat className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-300 text-sm">Transfer</span>
          </button>

          <button
            onClick={() => setShowConvert(true)}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <span className="text-gray-300 text-sm">Convert</span>
          </button>
        </div>

        {/* Account Sections */}
        <div className="space-y-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-colors">
            <div>
              <p className="text-white font-medium mb-1">Funding</p>
              <p className="text-gray-400 text-sm">
                {balanceVisible ? `${availableBalance.toFixed(2)} USD` : '••••••'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-colors">
            <div>
              <p className="text-white font-medium mb-1">Unified Trading</p>
              <p className="text-gray-400 text-sm">
                {balanceVisible ? `${inUseBalance.toFixed(2)} USD` : '••••••'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-colors">
            <div>
              <p className="text-white font-medium mb-1">Invested Products</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/70 transition-colors">
            <div>
              <p className="text-white font-medium mb-1">Earn</p>
              <p className="text-gray-400 text-sm">
                {balanceVisible ? `0.00 USD` : '••••••'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

      </div>

      {/* Portfolio & History Toggle */}
      <div className="mb-8">
        <div className="flex gap-4 mb-6 border-b border-gray-800 pb-2">
          <button
            onClick={() => setShowHistory(false)}
            className={`pb-2 text-lg font-semibold transition ${!showHistory ? 'text-white border-b-2 border-cyan-400' : 'text-gray-400'}`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`pb-2 text-lg font-semibold transition ${showHistory ? 'text-white border-b-2 border-cyan-400' : 'text-gray-400'}`}
          >
            Transaction History
          </button>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 min-h-[400px]">
          {showHistory ? (
            <TransactionHistory />
          ) : (
            <Portfolio />
          )}
        </div>
      </div>


      {/* Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Deposit Modal */}
      {
        showDeposit && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full mr-3"></div>
                Deposit Funds
              </h2>
              <form onSubmit={handleDeposit} className="space-y-5">
                {/* Deposit address / wallet placeholder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Deposit Network
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800/70 text-gray-200">
                      USDT • TRC20 (Demo)
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-700/70 bg-gray-900/60 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Deposit Address</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-mono text-gray-100 break-all">
                        TXX8C6D4PLH8XXXXPLACEHOLDERXXXXWALLET
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard?.writeText(
                            'TXX8C6D4PLH8XXXXPLACEHOLDERXXXXWALLET',
                          )
                        }
                        className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-amber-300/80">
                      Send only USDT to this address. Network and address are placeholders for demo
                      purposes.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Deposit requests require admin approval
                  </p>
                </div>
                {/* Payment confirmation / screenshot section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Payment Confirmation (optional)
                  </label>
                  <p className="text-xs text-gray-400">
                    Upload a transfer receipt or screenshot so our team can verify your deposit
                    faster.
                  </p>
                  <label className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-xl px-4 py-4 cursor-pointer hover:border-green-500/60 hover:bg-gray-800/40 transition-colors">
                    <span className="text-xs font-medium text-gray-200">
                      Click to upload or drag & drop
                    </span>
                    <span className="text-[11px] text-gray-500">
                      PNG, JPG, JPEG up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setPaymentScreenshot(file)
                          const url = URL.createObjectURL(file)
                          setScreenshotPreview(url)
                        } else {
                          setPaymentScreenshot(null)
                          setScreenshotPreview(null)
                        }
                      }}
                    />
                  </label>
                  {screenshotPreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-1">Preview</p>
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-700/70">
                        <img
                          src={screenshotPreview}
                          alt="Payment receipt preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeposit(false)}
                    className="flex-1 px-4 py-3 bg-gray-800/50 hover:bg-gray-800/80 text-white rounded-xl transition-all border border-gray-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-green-500/30"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Withdraw Modal */}
      {
        showWithdraw && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-red-400 to-rose-400 rounded-full mr-3"></div>
                Withdraw Funds
              </h2>
              <form onSubmit={handleWithdraw} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Enter wallet address"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Withdrawal requests require admin approval
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fund Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showWithdrawFundPassword ? 'text' : 'password'}
                      value={withdrawFundPassword}
                      onChange={(e) => setWithdrawFundPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all pr-12"
                      placeholder="Enter fund password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWithdrawFundPassword(!showWithdrawFundPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showWithdrawFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Required for all withdrawals
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="flex-1 px-4 py-3 bg-gray-800/50 hover:bg-gray-800/80 text-white rounded-xl transition-all border border-gray-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-red-500/30"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Transfer Modal */}
      {
        showTransfer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Transfer Funds</h2>
              <p className="text-gray-400 mb-4">Transfer functionality coming soon...</p>
              <button
                onClick={() => setShowTransfer(false)}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800/80 text-white rounded-xl transition-all border border-gray-700/50"
              >
                Close
              </button>
            </div>
          </div>
        )
      }

      {/* Convert Modal */}
      {
        showConvert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6">Convert Assets</h2>
              <p className="text-gray-400 mb-4">Convert functionality coming soon...</p>
              <button
                onClick={() => setShowConvert(false)}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800/80 text-white rounded-xl transition-all border border-gray-700/50"
              >
                Close
              </button>
            </div>
          </div>
        )
      }
    </div >
  )
}
