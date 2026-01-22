import { useState, useEffect } from 'react'
import { Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Wallet as WalletIcon } from 'lucide-react'
import { walletService, WalletBalance, Transaction } from '../services/walletService'

export default function Wallet() {
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [balancesData, transactionsData] = await Promise.all([
        walletService.getBalances(),
        walletService.getTransactions(),
      ])
      setBalances(balancesData)
      setTransactions(transactionsData)
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

    try {
      await walletService.withdraw({
        asset: 'USDT',
        amount: parseFloat(withdrawAmount),
        address: withdrawAddress,
      })
      setMessage({ type: 'success', text: 'Withdrawal request submitted successfully!' })
      setWithdrawAmount('')
      setWithdrawAddress('')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.includes('DEPOSIT')) {
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />
    } else if (type.includes('WITHDRAW')) {
      return <ArrowUpRight className="w-5 h-5 text-red-400" />
    } else if (type.includes('PROFIT')) {
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />
    } else {
      return <ArrowUpRight className="w-5 h-5 text-yellow-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Wallet
            </h1>
            <p className="text-gray-400 text-lg">Manage your funds and transactions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
            >
              <Minus className="w-5 h-5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {balances.map((balance) => (
            <div
              key={balance.asset}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                    <WalletIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{balance.asset}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Available</p>
                    <p className="text-3xl font-bold text-white">
                      {balance.available.toFixed(2)}
                    </p>
                  </div>
                  {balance.locked > 0 && (
                    <div className="pt-4 border-t border-gray-700/50">
                      <p className="text-sm text-gray-400 mb-1">Locked</p>
                      <p className="text-xl font-semibold text-yellow-400">
                        {balance.locked.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-700/50">
                    <p className="text-sm text-gray-400 mb-1">Total</p>
                    <p className="text-lg font-medium text-gray-300">
                      {balance.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
            Transaction History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Asset</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(tx.type)}
                          <span className="text-white">{tx.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white font-medium">{tx.asset}</td>
                      <td
                        className={`py-4 px-4 font-semibold ${
                          tx.type.includes('DEPOSIT') || tx.type.includes('PROFIT')
                            ? 'text-green-400'
                            : tx.type.includes('WITHDRAW') || tx.type.includes('LOSS')
                            ? 'text-red-400'
                            : 'text-white'
                        }`}
                      >
                        {tx.type.includes('WITHDRAW') || tx.type.includes('LOSS') || tx.type.includes('INVESTMENT') ? '-' : '+'}
                        {Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(tx.status)}
                          <span className="text-gray-300">{tx.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full mr-3"></div>
              Deposit Funds
            </h2>
            <form onSubmit={handleDeposit} className="space-y-5">
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
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
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
      )}
    </div>
  )
}
