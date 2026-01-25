import { Search } from 'lucide-react'
import { BinanceTicker } from '../services/binanceService'

interface MarketListProps {
  markets: BinanceTicker[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function MarketList({
  markets,
  selectedSymbol,
  onSelectSymbol,
  searchQuery,
  onSearchChange,
}: MarketListProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (numPrice >= 1) {
      return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return numPrice.toFixed(6)
  }

  const formatVolume = (volume: string) => {
    const numVolume = parseFloat(volume)
    if (numVolume >= 1000000) {
      return `${(numVolume / 1000000).toFixed(2)}M`
    }
    if (numVolume >= 1000) {
      return `${(numVolume / 1000).toFixed(2)}K`
    }
    return numVolume.toFixed(2)
  }

  const filteredMarkets = markets.filter((market) =>
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">Markets</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-800">
          {filteredMarkets.map((market) => {
            const isSelected = market.symbol === selectedSymbol
            const changePercent = parseFloat(market.priceChangePercent)
            const isPositive = changePercent >= 0

            return (
              <button
                key={market.symbol}
                onClick={() => onSelectSymbol(market.symbol)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors ${
                  isSelected ? 'bg-gray-800 border-l-2 border-cyan-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{market.symbol}</span>
                  <span
                    className={`text-sm font-medium ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{formatPrice(market.price)}</span>
                  <span className="text-gray-500">Vol: {formatVolume(market.quoteVolume)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

