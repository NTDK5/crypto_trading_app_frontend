import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight } from 'lucide-react'
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket'

export default function TopLosers() {
  const navigate = useNavigate()
  const { cryptoData, loading } = useCryptoWebSocket({ useWebSocket: true })

  const losers = useMemo(() => {
    return cryptoData
      .filter((crypto) => crypto.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 5)
  }, [cryptoData])

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(4)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(1)}B`
    }
    return `$${(volume / 1000000).toFixed(1)}M`
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowDownRight className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold text-white">↓ Top Losers</h2>
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
        <ArrowDownRight className="w-5 h-5 text-red-400" />
        <h2 className="text-xl font-bold text-white">↓ Top Losers</h2>
      </div>
      <div className="space-y-4">
        {losers.map((crypto: any, index: number) => (
          <div
            key={crypto.id}
            onClick={() => {
              const symbol = crypto.symbol.toUpperCase()
              const tradeSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
              navigate(`/app/trade?symbol=${tradeSymbol}`)
            }}
            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-gray-400 font-semibold w-6">{index + 1}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                ★
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">{crypto.symbol.toUpperCase()}</div>
                <div className="text-xs text-gray-400">{formatVolume(crypto.total_volume)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold mb-1">${formatPrice(crypto.current_price)}</div>
              <div className="inline-flex items-center gap-1 text-red-400 text-sm font-semibold">
                <ArrowDownRight className="w-4 h-4" />
                {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

