import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { tradeService, Trade } from '../services/tradeService'
import { walletService, WalletBalance } from '../services/walletService'
import { marketService, MarketData } from '../services/marketService'

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [tradesData, balancesData, marketDataData] = await Promise.all([
        tradeService.getUserTrades(),
        walletService.getBalances(),
        marketService.getAllMarketData(),
      ])
      setTrades(Array.isArray(tradesData) ? tradesData : [])
      setBalances(Array.isArray(balancesData) ? balancesData : [])
      setMarketData(Array.isArray(marketDataData) ? marketDataData.slice(0, 5) : []) // Top 5 assets
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const totalBalance = Array.isArray(balances) ? balances.reduce((sum, b) => sum + b.balance, 0) : 0
  const lockedBalance = Array.isArray(balances) ? balances.reduce((sum, b) => sum + b.locked, 0) : 0
  const availableBalance = totalBalance - lockedBalance

  const wonTrades = trades.filter((t) => t.status === 'WON').length
  const lostTrades = trades.filter((t) => t.status === 'LOST').length
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? (wonTrades / totalTrades) * 100 : 0

  const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0)

  const recentTrades = trades.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Your trading overview and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Balance</p>
            <DollarSign className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {totalBalance.toFixed(2)} USDT
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Available: {availableBalance.toFixed(2)} USDT
          </p>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Profit/Loss</p>
            {totalProfit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p
            className={`text-2xl font-bold ${
              totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {totalProfit >= 0 ? '+' : ''}
            {totalProfit.toFixed(2)} USDT
          </p>
          <p className="text-sm text-gray-400 mt-1">All time</p>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Win Rate</p>
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-1">
            {wonTrades}W / {lostTrades}L
          </p>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Trades</p>
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-white">{totalTrades}</p>
          <p className="text-sm text-gray-400 mt-1">
            {trades.filter((t) => t.status === 'OPEN' || t.status === 'PENDING').length} active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
          <div className="space-y-3">
            {recentTrades.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No trades yet</p>
            ) : (
              recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-dark-600"
                >
                  <div className="flex items-center space-x-3">
                    {trade.direction === 'UP' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-white font-medium">{trade.asset}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(trade.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{trade.amount} USDT</p>
                    <p
                      className={`text-xs font-medium ${
                        trade.status === 'WON'
                          ? 'text-green-500'
                          : trade.status === 'LOST'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                      }`}
                    >
                      {trade.status}
                      {trade.profit !== undefined && trade.profit !== null && (
                        <span className="ml-1">
                          {trade.profit >= 0 ? '+' : ''}
                          {trade.profit.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Markets */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Top Markets</h2>
          <div className="space-y-3">
            {marketData.map((asset) => {
              const isPositive = asset.change24h >= 0
              return (
                <div
                  key={asset.asset}
                  className="flex items-center justify-between p-4 bg-dark-700 rounded-lg border border-dark-600"
                >
                  <div>
                    <p className="text-white font-medium">{asset.asset}</p>
                    <p className="text-xs text-gray-400">
                      Vol: ${asset.volume24h.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p
                      className={`text-xs font-medium flex items-center justify-end ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(asset.change24h).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

