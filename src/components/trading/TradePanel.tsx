import { useState, useEffect, useMemo } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { marketService } from '../../services/marketService'
import { tradeService } from '../../services/tradeService'
import { spotTradeService } from '../../services/spotTradeService'
import { walletService } from '../../services/walletService'

interface TradePanelProps {
    initialAsset?: string
}

// Default fee rate (0.2% = 0.002) - client-side calculation only
const DEFAULT_FEE_RATE = 0.002

export default function TradePanel({ initialAsset = 'BTC' }: TradePanelProps) {
    const [activeTab, setActiveTab] = useState<'spot' | 'binary'>('spot')
    const [asset] = useState(initialAsset)
    const [price, setPrice] = useState(0)
    const [balance, setBalance] = useState(0)
    const [baseBalance, setBaseBalance] = useState(0) // Balance in base asset (BTC, ETH, etc.)

    // Spot State
    const [spotSide, setSpotSide] = useState<'BUY' | 'SELL'>('BUY')
    const [spotAmount, setSpotAmount] = useState('') // Quantity in base asset for SELL, quote amount for BUY
    const [orderType, setOrderType] = useState<'MARKET' | 'STOP' | 'LIMIT' | 'STOP_LIMIT'>('MARKET')
    const [triggerPrice, setTriggerPrice] = useState('')
    const [limitPrice, setLimitPrice] = useState('')
    const [stopPrice, setStopPrice] = useState('')
    const [stopOrders, setStopOrders] = useState<any[]>([])
    const [limitOrders, setLimitOrders] = useState<any[]>([])
    const [stopLimitOrders, setStopLimitOrders] = useState<any[]>([])

    // Binary State
    const [binaryDirection, setBinaryDirection] = useState<'UP' | 'DOWN' | null>(null)
    const [binaryAmount, setBinaryAmount] = useState('')
    const [binaryDuration, setBinaryDuration] = useState(60)

    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    const symbol = `${asset}USDT`

    // Auto-update price field when market price changes (for Limit/Stop-Limit orders)
    useEffect(() => {
        if (price > 0 && (orderType === 'LIMIT' || orderType === 'STOP_LIMIT')) {
            if (!limitPrice || limitPrice === '0' || limitPrice === '') {
                setLimitPrice(price.toFixed(2))
            }
        }
    }, [price, orderType])

    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const p = await marketService.getPrice(symbol)
                setPrice(p)

                const balances = await walletService.getBalances()
                const usdt = balances.find(b => b.asset === 'USDT')
                const base = balances.find(b => b.asset === asset)
                setBalance(usdt?.available || 0)
                setBaseBalance(base?.available || 0)
            } catch (e) {
                console.error(e)
            }
        }
        fetchMarket()
        const interval = setInterval(fetchMarket, 2000) // Update every 2 seconds
        return () => clearInterval(interval)
    }, [symbol, asset])

    useEffect(() => {
        if (activeTab === 'spot') {
            fetchStopOrders()
            fetchLimitOrders()
            fetchStopLimitOrders()
        }
    }, [activeTab, symbol])

    const fetchStopOrders = async () => {
        try {
            const orders = await spotTradeService.getStopOrders(symbol.replace('USDT', '/USDT'))
            setStopOrders(orders)
        } catch (e) {
            console.error("Failed to fetch stop orders", e)
        }
    }

    const fetchLimitOrders = async () => {
        try {
            const orders = await spotTradeService.getLimitOrders(symbol.replace('USDT', '/USDT'))
            setLimitOrders(orders)
        } catch (e) {
            console.error("Failed to fetch limit orders", e)
        }
    }

    const fetchStopLimitOrders = async () => {
        try {
            const orders = await spotTradeService.getStopLimitOrders(symbol.replace('USDT', '/USDT'))
            setStopLimitOrders(orders)
        } catch (e) {
            console.error("Failed to fetch stop-limit orders", e)
        }
    }

    // Client-side calculations
    const calculatedValues = useMemo(() => {
        const amount = parseFloat(spotAmount) || 0
        const currentPriceValue = price || 0
        // Use limit price if available, otherwise use market price
        const priceValue = orderType === 'MARKET' 
            ? currentPriceValue 
            : (parseFloat(limitPrice) || currentPriceValue)

        let total = 0
        let fee = 0
        let available = 0

        if (spotSide === 'BUY') {
            // BUY: amount is in USDT (quote currency)
            total = amount
            fee = amount * DEFAULT_FEE_RATE
            available = balance
        } else {
            // SELL: amount is in base asset (BTC, ETH, etc.)
            total = amount * priceValue
            fee = total * DEFAULT_FEE_RATE
            available = baseBalance
        }

        return {
            total: total.toFixed(2),
            fee: fee.toFixed(2),
            available: available.toFixed(8),
            totalWithFee: (total + fee).toFixed(2),
        }
    }, [spotAmount, price, limitPrice, orderType, spotSide, balance, baseBalance])

    // Handle percentage button clicks
    const handlePercentageClick = (percentage: number) => {
        if (spotSide === 'BUY') {
            // For BUY: percentage of USDT balance
            const maxAmount = balance
            const amount = (maxAmount * percentage).toFixed(2)
            setSpotAmount(amount)
        } else {
            // For SELL: percentage of base asset balance
            const maxAmount = baseBalance
            const amount = maxAmount * percentage
            // Determine decimal precision based on asset
            const decimals = asset === 'BTC' || asset === 'ETH' ? 8 : 4
            setSpotAmount(amount.toFixed(decimals))
        }
    }

    const handleSpotTrade = async () => {
        if (!spotAmount) return
        if (orderType === 'STOP' && !triggerPrice) return
        if (orderType === 'LIMIT' && !limitPrice) return
        if (orderType === 'STOP_LIMIT' && (!stopPrice || !limitPrice)) return

        setLoading(true)
        setMsg({ type: '', text: '' })
        try {
            const tradeSymbol = `${asset}/USDT`

            if (orderType === 'MARKET') {
                await spotTradeService.placeTrade({
                    symbol: tradeSymbol,
                    side: spotSide,
                    amount: parseFloat(spotAmount)
                })
                setMsg({ type: 'success', text: 'Market order executed successfully!' })
            } else if (orderType === 'STOP') {
                await spotTradeService.placeStopOrder({
                    symbol: tradeSymbol,
                    side: spotSide,
                    quantity: parseFloat(spotAmount),
                    triggerPrice: parseFloat(triggerPrice)
                })
                setMsg({ type: 'success', text: 'Stop order placed successfully!' })
                fetchStopOrders()
            } else if (orderType === 'LIMIT') {
                await spotTradeService.placeLimitOrder({
                    symbol: tradeSymbol,
                    side: spotSide,
                    quantity: parseFloat(spotAmount),
                    limitPrice: parseFloat(limitPrice)
                })
                setMsg({ type: 'success', text: 'Limit order placed successfully!' })
                fetchLimitOrders()
            } else if (orderType === 'STOP_LIMIT') {
                await spotTradeService.placeStopLimitOrder({
                    symbol: tradeSymbol,
                    side: spotSide,
                    quantity: parseFloat(spotAmount),
                    stopPrice: parseFloat(stopPrice),
                    limitPrice: parseFloat(limitPrice)
                })
                setMsg({ type: 'success', text: 'Stop-limit order placed successfully!' })
                fetchStopLimitOrders()
            }

            setSpotAmount('')
            setTriggerPrice('')
            setLimitPrice('')
            setStopPrice('')
        } catch (e: any) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'Trade failed' })
        } finally {
            setLoading(false)
        }
    }

    const cancelStopOrder = async (id: string) => {
        try {
            await spotTradeService.cancelStopOrder(id)
            setMsg({ type: 'success', text: 'Order cancelled' })
            fetchStopOrders()
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Failed to cancel order' })
        }
    }

    const cancelLimitOrder = async (id: string) => {
        try {
            await spotTradeService.cancelLimitOrder(id)
            setMsg({ type: 'success', text: 'Limit order cancelled' })
            fetchLimitOrders()
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Failed to cancel limit order' })
        }
    }

    const cancelStopLimitOrder = async (id: string) => {
        try {
            await spotTradeService.cancelStopLimitOrder(id)
            setMsg({ type: 'success', text: 'Stop-limit order cancelled' })
            fetchStopLimitOrders()
        } catch (e: any) {
            setMsg({ type: 'error', text: 'Failed to cancel stop-limit order' })
        }
    }

    const handleBinaryTrade = async () => {
        if (!binaryAmount || !binaryDirection) return
        setLoading(true)
        setMsg({ type: '', text: '' })
        try {
            await tradeService.createTrade({
                asset: symbol,
                direction: binaryDirection,
                amount: parseFloat(binaryAmount),
                duration: binaryDuration
            })
            setMsg({ type: 'success', text: 'Position opened!' })
            setBinaryAmount('')
            setBinaryDirection(null)
        } catch (e: any) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'Trade failed' })
        } finally {
            setLoading(false)
        }
    }

    // Validation
    const isFormValid = useMemo(() => {
        if (!spotAmount) return false
        if (orderType === 'STOP' && !triggerPrice) return false
        if (orderType === 'LIMIT' && !limitPrice) return false
        if (orderType === 'STOP_LIMIT' && (!stopPrice || !limitPrice)) return false

        // Check sufficient balance
        if (spotSide === 'BUY') {
            const totalWithFee = parseFloat(calculatedValues.totalWithFee)
            return totalWithFee <= balance
        } else {
            const amount = parseFloat(spotAmount)
            return amount <= baseBalance
        }
    }, [spotAmount, triggerPrice, limitPrice, stopPrice, orderType, spotSide, balance, baseBalance, calculatedValues])

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl h-full flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 p-2 border-b border-gray-800 overflow-x-auto sm:overflow-visible">
  {(['spot', 'binary'] as const).map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition
        ${activeTab === tab
          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
          : 'bg-gray-800 text-gray-400 hover:text-white'}
      `}
    >
      {tab === 'spot' ? 'Spot Trading' : 'Binary'}
    </button>
  ))}
</div>


            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                    {asset}/USDT
                    </span>
                    <span className="text-lg text-yellow-400 font-mono">
                    ${price.toFixed(2)}
                    </span>
                </div>

                <div className="text-xs text-gray-400">
                    Balance: <span className="text-cyan-400">{balance.toFixed(2)} USDT</span>
                </div>
                </div>


                {msg.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                        msg.type === 'success' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        {msg.text}
                    </div>
                )}

                {activeTab === 'spot' ? (
                    <div className="space-y-4">
                        {/* Order Type Tabs */}
                        <div className="grid grid-cols-2 gap-1 bg-gray-950 rounded-lg p-1 text-xs">
                            {(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`py-1.5 rounded-md font-medium transition relative ${
                                        orderType === type 
                                            ? 'bg-gray-800 text-cyan-400' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                    style={orderType === type ? {
                                        boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)',
                                    } : {}}
                                >
                                    {type.replace('_', '-')}
                                </button>
                            ))}
                        </div>

                        {/* Buy/Sell Toggle */}
                        <div className="flex bg-gray-950 rounded-lg p-1">
                            <button
                                onClick={() => setSpotSide('BUY')}
                                className={`flex-1 py-3 rounded-md font-bold transition relative ${
                                    spotSide === 'BUY' 
                                        ? 'bg-green-600 text-white' 
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                                style={spotSide === 'BUY' ? {
                                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)',
                                } : {}}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setSpotSide('SELL')}
                                className={`flex-1 py-3 rounded-md font-bold transition relative ${
                                    spotSide === 'SELL' 
                                        ? 'bg-red-600 text-white' 
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                                style={spotSide === 'SELL' ? {
                                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                                } : {}}
                            >
                                SELL
                            </button>
                        </div>

                        {/* Price Field - Auto-updates, editable for Limit/Stop-Limit, disabled for Market */}
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">
                                {orderType === 'MARKET' ? 'Market Price' : orderType === 'LIMIT' ? 'Limit Price' : orderType === 'STOP_LIMIT' ? 'Limit Price' : 'Price'} (USDT)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={orderType === 'MARKET' ? price.toFixed(2) : limitPrice}
                                    onChange={(e) => {
                                        if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
                                            setLimitPrice(e.target.value)
                                        }
                                    }}
                                    disabled={orderType === 'MARKET' || orderType === 'STOP'}
                                    className={`w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition ${
                                        orderType === 'MARKET' || orderType === 'STOP' ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                    placeholder={price.toFixed(2)}
                                    style={{
                                        boxShadow: (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && limitPrice 
                                            ? '0 0 8px rgba(34, 211, 238, 0.2)' 
                                            : 'none',
                                    }}
                                />
                                <span className="absolute right-4 top-3 text-gray-500 text-sm">USDT</span>
                            </div>
                            {orderType === 'MARKET' && (
                                <p className="text-xs text-gray-500 mt-1">Price updates automatically from market</p>
                            )}
                        </div>

                        {/* Stop Price - Only for Stop-Limit */}
                        {orderType === 'STOP_LIMIT' && (
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Stop Price (USDT)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={stopPrice}
                                        onChange={(e) => setStopPrice(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition"
                                        placeholder="0.00"
                                        style={{
                                            boxShadow: stopPrice ? '0 0 8px rgba(34, 211, 238, 0.2)' : 'none',
                                        }}
                                    />
                                    <span className="absolute right-4 top-3 text-gray-500 text-sm">USDT</span>
                                </div>
                            </div>
                        )}

                        {/* Trigger Price - Only for Stop */}
                        {orderType === 'STOP' && (
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Trigger Price (USDT)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={triggerPrice}
                                        onChange={(e) => setTriggerPrice(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition"
                                        placeholder="0.00"
                                        style={{
                                            boxShadow: triggerPrice ? '0 0 8px rgba(34, 211, 238, 0.2)' : 'none',
                                        }}
                                    />
                                    <span className="absolute right-4 top-3 text-gray-500 text-sm">USDT</span>
                                </div>
                            </div>
                        )}

                        {/* Quantity Input */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-gray-400">
                                    {spotSide === 'BUY' ? 'Amount' : 'Quantity'} ({spotSide === 'BUY' ? 'USDT' : asset})
                                </label>
                                <span className="text-xs text-gray-500">
                                    Available: {spotSide === 'BUY' ? `${balance.toFixed(2)} USDT` : `${baseBalance.toFixed(8)} ${asset}`}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    step={spotSide === 'BUY' ? '0.01' : '0.00000001'}
                                    value={spotAmount}
                                    onChange={(e) => setSpotAmount(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition"
                                    placeholder="0.00"
                                    style={{
                                        boxShadow: spotAmount ? '0 0 8px rgba(34, 211, 238, 0.2)' : 'none',
                                    }}
                                />
                                <span className="absolute right-4 top-3 text-gray-500 text-sm">
                                    {spotSide === 'BUY' ? 'USDT' : asset}
                                </span>
                            </div>
                            {/* Percentage Buttons */}
                            <div className="flex gap-2 mt-2">
                                {[25, 50, 75, 100].map((pct) => (
                                    <button
                                        key={pct}
                                        onClick={() => handlePercentageClick(pct / 100)}
                                        className="flex-1 py-1.5 text-xs font-medium bg-gray-950 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calculated Display Fields */}
                        <div className="bg-gray-950 rounded-xl p-4 space-y-2 border border-gray-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total</span>
                                <span className="text-white font-medium">{calculatedValues.total} USDT</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Estimated Fee</span>
                                <span className="text-gray-300">{calculatedValues.fee} USDT</span>
                            </div>
                            {spotSide === 'BUY' && (
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                                    <span className="text-gray-400">Total Cost</span>
                                    <span className="text-cyan-400 font-semibold">{calculatedValues.totalWithFee} USDT</span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleSpotTrade}
                            disabled={loading || !isFormValid}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition relative disabled:opacity-50 disabled:cursor-not-allowed ${
                                spotSide === 'BUY'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400'
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400'
                            }`}
                            style={!loading && isFormValid ? {
                                boxShadow: spotSide === 'BUY' 
                                    ? '0 0 20px rgba(34, 197, 94, 0.6)' 
                                    : '0 0 20px rgba(239, 68, 68, 0.6)',
                            } : {}}
                        >
                            {loading ? 'Processing...' : `${orderType.replace('_', '-')} ${spotSide} ${asset}`}
                        </button>

                        {/* Open Orders Section */}
                        {(stopOrders.length > 0 || limitOrders.length > 0 || stopLimitOrders.length > 0) && (
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <h4 className="text-gray-400 text-sm font-semibold mb-3">Open Orders</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {limitOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg text-xs border border-gray-800">
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    <span className="text-blue-400 text-[10px]">LIMIT</span>
                                                    <span className={order.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                                        {order.side}
                                                    </span>
                                                    <span className="text-white">{order.symbol}</span>
                                                </div>
                                                <div className="text-gray-500 mt-1">
                                                    Limit: <span className="text-yellow-400">{parseFloat(order.limitPrice).toFixed(2)}</span>
                                                    {' • '}
                                                    Amt: {parseFloat(order.quantity).toFixed(4)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => cancelLimitOrder(order.id)}
                                                className="text-red-400 hover:text-red-300 px-2 py-1 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                    {stopLimitOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg text-xs border border-gray-800">
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    <span className="text-purple-400 text-[10px]">STOP-LIMIT</span>
                                                    <span className={order.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                                        {order.side}
                                                    </span>
                                                    <span className="text-white">{order.symbol}</span>
                                                </div>
                                                <div className="text-gray-500 mt-1">
                                                    Stop: <span className="text-orange-400">{parseFloat(order.stopPrice).toFixed(2)}</span>
                                                    {' • '}
                                                    Limit: <span className="text-yellow-400">{parseFloat(order.limitPrice).toFixed(2)}</span>
                                                    {' • '}
                                                    Amt: {parseFloat(order.quantity).toFixed(4)}
                                                    {order.status === 'ACTIVE' && <span className="ml-2 text-cyan-400">(Active)</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => cancelStopLimitOrder(order.id)}
                                                className="text-red-400 hover:text-red-300 px-2 py-1 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                    {stopOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg text-xs border border-gray-800">
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    <span className="text-orange-400 text-[10px]">STOP</span>
                                                    <span className={order.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                                                        {order.side}
                                                    </span>
                                                    <span className="text-white">{order.symbol}</span>
                                                </div>
                                                <div className="text-gray-500 mt-1">
                                                    Trigger: <span className="text-yellow-400">{parseFloat(order.triggerPrice).toFixed(2)}</span>
                                                    {' • '}
                                                    Amt: {parseFloat(order.quantity).toFixed(4)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => cancelStopOrder(order.id)}
                                                className="text-red-400 hover:text-red-300 px-2 py-1 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setBinaryDirection('UP')}
                                className={`p-4 rounded-xl border-2 transition ${
                                    binaryDirection === 'UP'
                                        ? 'border-green-500 bg-green-500/10 text-green-400'
                                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                }`}
                                style={binaryDirection === 'UP' ? {
                                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
                                } : {}}
                            >
                                <ArrowUp className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-bold">CALL (UP)</div>
                            </button>
                            <button
                                onClick={() => setBinaryDirection('DOWN')}
                                className={`p-4 rounded-xl border-2 transition ${
                                    binaryDirection === 'DOWN'
                                        ? 'border-red-500 bg-red-500/10 text-red-400'
                                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                }`}
                                style={binaryDirection === 'DOWN' ? {
                                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                                } : {}}
                            >
                                <ArrowDown className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-bold">PUT (DOWN)</div>
                            </button>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Investment Amount</label>
                            <input
                                type="number"
                                value={binaryAmount}
                                onChange={(e) => setBinaryAmount(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                placeholder="10.00"
                                style={{
                                    boxShadow: binaryAmount ? '0 0 8px rgba(168, 85, 247, 0.2)' : 'none',
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Duration</label>
                            <div className="flex gap-2">
                                {[60, 180, 300].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setBinaryDuration(d)}
                                        className={`flex-1 py-2 rounded-lg text-sm border transition ${
                                            binaryDuration === d 
                                                ? 'border-purple-500 text-purple-400 bg-purple-500/10' 
                                                : 'border-gray-800 text-gray-400 bg-gray-950'
                                        }`}
                                        style={binaryDuration === d ? {
                                            boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                                        } : {}}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleBinaryTrade}
                            disabled={loading || !binaryAmount || !binaryDirection}
                            className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 disabled:opacity-50 transition relative"
                            style={!loading && binaryAmount && binaryDirection ? {
                                boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
                            } : {}}
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
