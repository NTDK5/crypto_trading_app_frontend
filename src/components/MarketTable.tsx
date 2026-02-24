import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Search, TrendingUp } from 'lucide-react'
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket'



type FilterType = 'all' | 'gainers' | 'losers'
type SortType = 'volume' | 'price' | 'change' | 'name'

export default function MarketTable() {
  const navigate = useNavigate()
  const { cryptoData, loading } = useCryptoWebSocket({ useWebSocket: true })
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('volume')
  const [displayCount, setDisplayCount] = useState(50)

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...cryptoData]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply gainers/losers filter
    if (filter === 'gainers') {
      filtered = filtered.filter((crypto) => crypto.price_change_percentage_24h > 0)
    } else if (filter === 'losers') {
      filtered = filtered.filter((crypto) => crypto.price_change_percentage_24h < 0)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.total_volume - a.total_volume
        case 'price':
          return b.current_price - a.current_price
        case 'change':
          return b.price_change_percentage_24h - a.price_change_percentage_24h
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return filtered
  }, [cryptoData, searchQuery, filter, sortBy])

  // Get displayed data based on displayCount
  const displayedData = useMemo(() => {
    return filteredAndSortedData.slice(0, displayCount)
  }, [filteredAndSortedData, displayCount])

  // Calculate how many more items to load
  const handleLoadMore = () => {
    if (displayCount === 50) {
      // First load: 50 -> 100
      setDisplayCount(100)
    } else {
      // Subsequent loads: add 100 each time
      setDisplayCount((prev) => prev + 100)
    }
  }

  const hasMore = displayCount < filteredAndSortedData.length

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return price.toFixed(6)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`
    }
    return `$${(volume / 1000000).toFixed(2)}M`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('gainers')}
            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'gainers'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setFilter('losers')}
            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'losers'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            Losers
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
        >
          <option value="volume">Sort by Volume</option>
          <option value="price">Sort by Price</option>
          <option value="change">Sort by Change</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  24H Change
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  24H High
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  24H Low
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  24H Volume
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {displayedData.map((crypto, index) => {
                const isPositive = (crypto.price_change_percentage_24h ?? 0) >= 0
                return (
                  <tr
                    key={crypto.id}
                    className="hover:bg-gray-800/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          {crypto.symbol.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {crypto.symbol.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-400">/USDT</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-white">
                      ${formatPrice(crypto.current_price ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${isPositive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {isPositive ? '+' : ''}
                        {(crypto.price_change_percentage_24h ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                      ${formatPrice(crypto.high_24h ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                      ${formatPrice(crypto.low_24h ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                      {formatVolume(crypto.total_volume ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          const symbol = crypto.symbol.toUpperCase()
                          const tradeSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
                          navigate(`/app/trade?symbol=${tradeSymbol}`)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-lg text-sm font-medium text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400 transition"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Trade
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-lg text-sm font-medium text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400 transition-all duration-300 hover:scale-105"
          >
            Load More ({displayedData.length} of {filteredAndSortedData.length})
          </button>
        </div>
      )}
    </div>
  )
}

