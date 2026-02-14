import { BinanceOrderBook } from '../services/binanceService'

interface OrderBookProps {
  orderBook: BinanceOrderBook | null
  grouping: string
  onGroupingChange: (grouping: string) => void
}

export default function OrderBook({ orderBook, grouping, onGroupingChange }: OrderBookProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (numPrice >= 1) {
      return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return numPrice.toFixed(8)
  }

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(5)
  }

  if (!orderBook) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading order book...
      </div>
    )
  }

  // Sort asks from lowest to highest (for display)
  const asks = [...orderBook.asks].slice(0, 10).reverse()
  // Bids are already sorted from highest to lowest
  const bids = orderBook.bids.slice(0, 10)

  const bestAsk = parseFloat(asks[asks.length - 1]?.[0] || '0')
  const bestBid = parseFloat(bids[0]?.[0] || '0')
  const spread = bestAsk - bestBid
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0

  // Calculate max total for depth visualization
  const asksReversed = [...asks].reverse() // Original order for calculation
  const maxAskTotal = asksReversed.reduce((sum, ask) => {
    return sum + parseFloat(ask[1]) * parseFloat(ask[0])
  }, 0)

  const maxBidTotal = bids.reduce((sum, bid) => {
    return sum + parseFloat(bid[1]) * parseFloat(bid[0])
  }, 0)

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Order Book</h2>
          <select
            value={grouping}
            onChange={(e) => onGroupingChange(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="0.01">0.01</option>
            <option value="0.1">0.1</option>
            <option value="1">1</option>
            <option value="10">10</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Asks (Sell Orders) */}
        <div className="px-4">
          {asks.map((ask, index) => {
            // Calculate cumulative total from lowest ask up to this one
            const asksForCalc = [...asks].reverse()
            let total = 0
            for (let i = 0; i <= asks.length - 1 - index; i++) {
              total += parseFloat(asksForCalc[i][1]) * parseFloat(asksForCalc[i][0])
            }

            return (
              <div
                key={`ask-${index}`}
                className="relative flex items-center justify-between py-1 text-sm hover:bg-red-500/10 cursor-pointer group"
              >
                <div className="absolute left-0 top-0 h-full bg-red-500/20 opacity-30"
                  style={{ width: `${maxAskTotal > 0 ? (total / maxAskTotal) * 100 : 0}%` }}
                />
                <span className="text-red-400 font-medium relative z-10 flex-1">{formatPrice(ask[0])}</span>
                <span className="text-gray-300 relative z-10">{formatAmount(ask[1])}</span>
                <span className="text-gray-400 relative z-10 w-20 text-right">{parseInt(total.toFixed(0)).toLocaleString()}</span>
              </div>
            )
          })}
        </div>

        {/* Spread */}
        <div className="px-4 py-2 border-y border-gray-800 bg-gray-800/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Spread:</span>
            <span className="text-white font-medium">
              {spread.toFixed(8)} ({spreadPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="px-4">
          {bids.map((bid, index) => {
            let total = 0
            for (let i = 0; i <= index; i++) {
              total += parseFloat(bids[i][1]) * parseFloat(bids[i][0])
            }

            return (
              <div
                key={`bid-${index}`}
                className="relative flex items-center justify-between py-1 text-sm hover:bg-green-500/10 cursor-pointer group"
              >
                <div className="absolute left-0 top-0 h-full bg-green-500/20 opacity-30"
                  style={{ width: `${maxBidTotal > 0 ? (total / maxBidTotal) * 100 : 0}%` }}
                />
                <span className="text-green-400 font-medium relative z-10 flex-1">{formatPrice(bid[0])}</span>
                <span className="text-gray-300 relative z-10">{formatAmount(bid[1])}</span>
                <span className="text-gray-400 relative z-10 w-20 text-right">{parseInt(total.toFixed(0)).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

