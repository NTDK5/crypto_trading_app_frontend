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
    const interval = setInterval(fetchData, 10000)
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
      setMarketData(Array.isArray(marketDataData) ? marketDataData.slice(0, 5) : [])
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-2 border-cyan-500 opacity-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Your trading overview and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">Total Balance</p>
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {totalBalance.toFixed(2)} USDT
              </p>
              <p className="text-sm text-gray-400">
                Available: {availableBalance.toFixed(2)} USDT
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">Total Profit/Loss</p>
                {totalProfit >= 0 ? (
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                )}
              </div>
              <p
                className={`text-3xl font-bold mb-1 ${
                  totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {totalProfit >= 0 ? '+' : ''}
                {totalProfit.toFixed(2)} USDT
              </p>
              <p className="text-sm text-gray-400">All time</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">Win Rate</p>
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{winRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">
                {wonTrades}W / {lostTrades}L
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">Total Trades</p>
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{totalTrades}</p>
              <p className="text-sm text-gray-400">
                {trades.filter((t) => t.status === 'OPEN' || t.status === 'PENDING').length} active
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Trades */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
              Recent Trades
            </h2>
            <div className="space-y-3">
              {recentTrades.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No trades yet</p>
              ) : (
                recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      {trade.direction === 'UP' ? (
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <ArrowUpRight className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <ArrowDownRight className="w-5 h-5 text-red-400" />
                        </div>
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
                            ? 'text-green-400'
                            : trade.status === 'LOST'
                            ? 'text-red-400'
                            : 'text-yellow-400'
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
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
              Top Markets
            </h2>
            <div className="space-y-3">
              {marketData.map((asset) => {
                const isPositive = asset.change24h >= 0
                return (
                  <div
                    key={asset.asset}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
                  >
                    <div>
                      <p className="text-white font-medium">{asset.asset}</p>
                      <p className="text-xs text-gray-400">
                        Vol: ${(asset.volume24h / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p
                        className={`text-xs font-medium flex items-center justify-end ${
                          isPositive ? 'text-green-400' : 'text-red-400'
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
    </div>
  )
}
