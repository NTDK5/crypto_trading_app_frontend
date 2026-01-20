import { useState, useEffect } from 'react'
import { Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
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
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.includes('DEPOSIT')) {
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />
    } else if (type.includes('WITHDRAW')) {
      return <ArrowUpRight className="w-5 h-5 text-red-500" />
    } else if (type.includes('PROFIT')) {
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />
    } else {
      return <ArrowUpRight className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-gray-400">Manage your funds and transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeposit(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Minus className="w-5 h-5" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50 text-green-500'
              : 'bg-red-500/10 border border-red-500/50 text-red-500'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {balances.map((balance) => (
          <div key={balance.asset} className="bg-dark-800 rounded-lg border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{balance.asset}</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-2xl font-bold text-white">
                  {balance.available.toFixed(2)}
                </p>
              </div>
              {balance.locked > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Locked</p>
                  <p className="text-lg font-semibold text-yellow-500">
                    {balance.locked.toFixed(2)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-lg font-medium text-gray-300">
                  {balance.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Asset</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(tx.type)}
                        <span className="text-white">{tx.type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white">{tx.asset}</td>
                    <td
                      className={`py-3 px-4 font-semibold ${
                        tx.type.includes('DEPOSIT') || tx.type.includes('PROFIT')
                          ? 'text-green-500'
                          : tx.type.includes('WITHDRAW') || tx.type.includes('LOSS')
                          ? 'text-red-500'
                          : 'text-white'
                      }`}
                    >
                      {tx.type.includes('WITHDRAW') || tx.type.includes('LOSS') || tx.type.includes('INVESTMENT') ? '-' : '+'}
                      {Math.abs(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(tx.status)}
                        <span className="text-gray-300">{tx.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Deposit Funds</h2>
            <form onSubmit={handleDeposit} className="space-y-4">
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
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deposit requests require admin approval
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeposit(false)}
                  className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
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
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter wallet address"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Withdrawal requests require admin approval
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
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

