import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { marketService, MarketData } from '../services/marketService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Market() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    fetchMarketData()

    const interval = setInterval(fetchMarketData, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedAsset) {
      generateChartData()
    }
  }, [selectedAsset, marketData])

  const fetchMarketData = async () => {
    try {
      const data = await marketService.getAllMarketData()
      setMarketData(data)
      if (!selectedAsset && data.length > 0) {
        setSelectedAsset(data[0].asset)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      setLoading(false)
    }
  }

  const generateChartData = () => {
    // Generate mock chart data (in real app, fetch historical data)
    const data = []
    const selected = marketData.find((m) => m.asset === selectedAsset)
    if (selected) {
      const basePrice = selected.price
      for (let i = 24; i >= 0; i--) {
        const variance = (Math.random() - 0.5) * (basePrice * 0.05)
        data.push({
          time: `${i}h`,
          price: basePrice + variance,
        })
      }
    }
    setChartData(data)
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(6)
  }

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
        <h1 className="text-3xl font-bold text-white mb-2">Market Overview</h1>
        <p className="text-gray-400">Real-time cryptocurrency prices and market data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market List */}
        <div className="lg:col-span-1 space-y-3">
          {marketData.map((asset) => {
            const isPositive = asset.change24h >= 0
            const isSelected = selectedAsset === asset.asset
            return (
              <button
                key={asset.asset}
                onClick={() => setSelectedAsset(asset.asset)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-primary-600/20 border-primary-500'
                    : 'bg-dark-800 border-dark-700 hover:border-primary-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {asset.asset.replace('USDT', '')}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{asset.asset}</div>
                      <div className="text-xs text-gray-400">24h Volume</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">${formatPrice(asset.price)}</div>
                    <div
                      className={`text-sm font-semibold flex items-center justify-end ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(asset.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Vol: ${asset.volume24h.toLocaleString()}
                </div>
              </button>
            )
          })}
        </div>

        {/* Chart and Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAsset && (
            <>
              {(() => {
                const selected = marketData.find((m) => m.asset === selectedAsset)
                if (!selected) return null

                const isPositive = selected.change24h >= 0
                return (
                  <>
                    {/* Asset Header */}
                    <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {selected.asset}
                          </h2>
                          <p className="text-gray-400">24 Hour Statistics</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white mb-1">
                            ${formatPrice(selected.price)}
                          </div>
                          <div
                            className={`text-lg font-semibold flex items-center justify-end ${
                              isPositive ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-5 h-5 mr-1" />
                            ) : (
                              <TrendingDown className="w-5 h-5 mr-1" />
                            )}
                            {isPositive ? '+' : ''}
                            {selected.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#fff',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="#0ea5e9"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Market Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
                        <p className="text-sm text-gray-400 mb-1">24h High</p>
                        <p className="text-lg font-semibold text-white">
                          ${formatPrice(selected.high24h)}
                        </p>
                      </div>
                      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
                        <p className="text-sm text-gray-400 mb-1">24h Low</p>
                        <p className="text-lg font-semibold text-white">
                          ${formatPrice(selected.low24h)}
                        </p>
                      </div>
                      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
                        <p className="text-sm text-gray-400 mb-1">24h Volume</p>
                        <p className="text-lg font-semibold text-white">
                          ${selected.volume24h.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-dark-800 rounded-lg border border-dark-700 p-4">
                        <p className="text-sm text-gray-400 mb-1">24h Change</p>
                        <p
                          className={`text-lg font-semibold ${
                            isPositive ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {selected.change24h.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

