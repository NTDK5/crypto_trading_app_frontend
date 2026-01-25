import { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, Flame } from 'lucide-react'
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket'

interface CryptoData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
}

export default function TrendingNow() {
  const { cryptoData, loading } = useCryptoWebSocket({ useWebSocket: true })

  const trending = useMemo(() => {
    return cryptoData
      .sort((a, b) => (b.market_cap_rank || 999) - (a.market_cap_rank || 999))
      .slice(0, 5)
  }, [cryptoData])

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(4)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">🔥 Trending Now</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">🔥 Trending Now</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {trending.map((crypto) => {
          const isPositive = crypto.price_change_percentage_24h >= 0
          return (
            <div
              key={crypto.id}
              className="bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800/70 transition-all hover:scale-105 border border-gray-700/50 hover:border-cyan-500/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm mb-3">
                  ★
                </div>
                <div className="text-white font-semibold mb-2">{crypto.symbol.toUpperCase()}</div>
                <div className="text-white font-bold text-lg mb-2">${formatPrice(crypto.current_price)}</div>
                <div
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}
                  {crypto.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

