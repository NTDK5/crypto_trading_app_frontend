import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { marketService, MarketData } from '../services/marketService'
import TradingChart from '../components/TradingChart'
import MarketTable from '../components/MarketTable'
import TopGainers from '../components/TopGainers'
import TopLosers from '../components/TopLosers'
import TrendingNow from '../components/TrendingNow'

export default function Market() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{ time: number; value: number }>>([])

  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 5000)
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
    const data: Array<{ time: number; value: number }> = []
    const selected = marketData.find((m) => m.asset === selectedAsset)
    if (selected) {
      const basePrice = selected.price
      const now = Math.floor(Date.now() / 1000)
      // Generate 24 hours of hourly data
      for (let i = 24; i >= 0; i--) {
        const variance = (Math.random() - 0.5) * (basePrice * 0.05)
        data.push({
          time: now - (i * 3600),
          value: basePrice + variance,
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-2 border-cyan-500 opacity-20"></div>
        </div>
      </div>
    )
  }

  const selected = marketData.find((m) => m.asset === selectedAsset)
  const isPositive = selected ? selected.change24h >= 0 : false

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Market Overview
          </h1>
          <p className="text-gray-400 text-sm md:text-base lg:text-lg">Real-time cryptocurrency market data and analysis</p>
        </div>

        {/* Market Table */}
        <div className="mb-8">
          <MarketTable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Market List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-3 md:p-4">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">Markets</h2>
              <div className="space-y-2 max-h-[400px] md:max-h-[600px] overflow-y-auto scrollbar-hide">
                {marketData.map((asset) => {
                  const isSelected = selectedAsset === asset.asset
                  const assetIsPositive = asset.change24h >= 0
                  return (
                    <button
                      key={asset.asset}
                      onClick={() => setSelectedAsset(asset.asset)}
                      className={`w-full p-4 rounded-xl border transition-all duration-300 text-left group ${isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'bg-gray-800/50 border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-800/80'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300'
                            }`}>
                            {asset.asset.replace('USDT', '')}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{asset.asset}</div>
                            <div className="text-xs text-gray-400">Vol: ${(asset.volume24h / 1000000).toFixed(1)}M</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">${formatPrice(asset.price)}</div>
                          <div
                            className={`text-sm font-semibold flex items-center justify-end ${assetIsPositive ? 'text-green-400' : 'text-red-400'
                              }`}
                          >
                            {assetIsPositive ? (
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(asset.change24h).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Chart and Details */}
          <div className="lg:col-span-3 space-y-6">
            {selected && (
              <>
                {/* Asset Header */}
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {selected.asset}
                      </h2>
                      <p className="text-gray-400">24 Hour Statistics</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white mb-2">
                        ${formatPrice(selected.price)}
                      </div>
                      <div
                        className={`text-xl font-semibold flex items-center justify-end ${isPositive ? 'text-green-400' : 'text-red-400'
                          }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-6 h-6 mr-2" />
                        ) : (
                          <TrendingDown className="w-6 h-6 mr-2" />
                        )}
                        {isPositive ? '+' : ''}
                        {selected.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Trading Chart */}
                  <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50">
                    <TradingChart
                      data={chartData}
                      color={isPositive ? '#10b981' : '#ef4444'}
                      height={400}
                    />
                  </div>
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                    <p className="text-sm text-gray-400 mb-2">24h High</p>
                    <p className="text-xl font-bold text-white">
                      ${formatPrice(selected.high24h)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                    <p className="text-sm text-gray-400 mb-2">24h Low</p>
                    <p className="text-xl font-bold text-white">
                      ${formatPrice(selected.low24h)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                    <p className="text-sm text-gray-400 mb-2">24h Volume</p>
                    <p className="text-xl font-bold text-white">
                      ${(selected.volume24h / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                    <p className="text-sm text-gray-400 mb-2">24h Change</p>
                    <p
                      className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                      {isPositive ? '+' : ''}
                      {selected.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Gainers and Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <TopGainers />
          <TopLosers />
        </div>

        {/* Trending Now */}
        <div className="mt-8">
          <TrendingNow />
        </div>
      </div>
    </div>
  )
}
