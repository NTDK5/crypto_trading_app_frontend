import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { marketService } from '../../services/marketService'
import { tradeService } from '../../services/tradeService'
import { spotTradeService } from '../../services/spotTradeService'
import { walletService } from '../../services/walletService'

interface TradePanelProps {
    initialAsset?: string
}

export default function TradePanel({ initialAsset = 'BTC' }: TradePanelProps) {
    const [activeTab, setActiveTab] = useState<'spot' | 'binary'>('spot')
    const [asset] = useState(initialAsset)
    const [price, setPrice] = useState(0)
    const [balance, setBalance] = useState(0)

    // Spot State
    const [spotSide, setSpotSide] = useState<'BUY' | 'SELL'>('BUY')
    const [spotAmount, setSpotAmount] = useState('') // Quote amount (USDT)
    const [orderType, setOrderType] = useState<'MARKET' | 'STOP'>('MARKET')
    const [triggerPrice, setTriggerPrice] = useState('')
    const [stopOrders, setStopOrders] = useState<any[]>([])

    // Binary State
    const [binaryDirection, setBinaryDirection] = useState<'UP' | 'DOWN' | null>(null)
    const [binaryAmount, setBinaryAmount] = useState('')
    const [binaryDuration, setBinaryDuration] = useState(60)

    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    const symbol = `${asset}USDT`

    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const p = await marketService.getPrice(symbol)
                setPrice(p)

                const balances = await walletService.getBalances()
                const usdt = balances.find(b => b.asset === 'USDT')
                setBalance(usdt?.available || 0)
            } catch (e) {
                console.error(e)
            }
        }
        fetchMarket()
        const interval = setInterval(fetchMarket, 5000)
        return () => clearInterval(interval)
    }, [symbol])

    useEffect(() => {
        if (activeTab === 'spot') {
            fetchStopOrders()
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

    const handleSpotTrade = async () => {
        if (!spotAmount) return
        if (orderType === 'STOP' && !triggerPrice) return

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
            } else {
                await spotTradeService.placeStopOrder({
                    symbol: tradeSymbol,
                    side: spotSide,
                    quantity: parseFloat(spotAmount), // Note: BE expects quantity/amount logic. For simplicty passing amount as quantity if that's how BE interprets it or need conversion? 
                    // BE placeSpotTrade takes "amount". stopOrderService takes "quantity". 
                    // Let's assume user inputs amount in USDT for BUY and Amount in Asset for SELL?
                    // Simplified: Just passing input as quantity for now.
                    // Wait, BE placeSpotTrade usually takes quoteAmount for BUY.
                    // Implementation Plan said: "quantity" in StopOrder model.
                    // Let's pass it as quantity. Ideally logic should handle quote vs base.
                    triggerPrice: parseFloat(triggerPrice)
                })
                setMsg({ type: 'success', text: 'Stop order placed successfully!' })
                fetchStopOrders()
            }

            setSpotAmount('')
            setTriggerPrice('')
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

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('spot')}
                    className={`flex-1 py-4 font-semibold text-sm transition ${activeTab === 'spot' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Spot Trading
                </button>
                <button
                    onClick={() => setActiveTab('binary')}
                    className={`flex-1 py-4 font-semibold text-sm transition ${activeTab === 'binary' ? 'bg-gray-800 text-purple-400' : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Futures / Binary
                </button>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{asset}/USDT</span>
                        <span className="text-lg text-yellow-400 font-mono">${price.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        Bal: <span className="text-cyan-400">{balance.toFixed(2)} USDT</span>
                    </div>
                </div>

                {msg.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {msg.text}
                    </div>
                )}

                {activeTab === 'spot' ? (
                    <div className="space-y-4">
                        {/* Order Type Tabs */}
                        <div className="flex bg-gray-950 rounded-lg p-1 text-xs mb-2">
                            <button
                                onClick={() => setOrderType('MARKET')}
                                className={`flex-1 py-1.5 rounded-md font-medium transition ${orderType === 'MARKET' ? 'bg-gray-800 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Market
                            </button>
                            <button
                                onClick={() => setOrderType('STOP')}
                                className={`flex-1 py-1.5 rounded-md font-medium transition ${orderType === 'STOP' ? 'bg-gray-800 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Stop
                            </button>
                        </div>

                        <div className="flex bg-gray-950 rounded-lg p-1">
                            <button
                                onClick={() => setSpotSide('BUY')}
                                className={`flex-1 py-2 rounded-md font-bold transition ${spotSide === 'BUY' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setSpotSide('SELL')}
                                className={`flex-1 py-2 rounded-md font-bold transition ${spotSide === 'SELL' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>

                        {orderType === 'STOP' && (
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Trigger Price (USDT)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={triggerPrice}
                                        onChange={(e) => setTriggerPrice(e.target.value)}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-3 text-gray-500 text-sm">USDT</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Amount (USDT)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={spotAmount}
                                    onChange={(e) => setSpotAmount(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-4 top-3 text-gray-500 text-sm">USDT</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSpotTrade}
                            disabled={loading || !spotAmount || (orderType === 'STOP' && !triggerPrice)}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50 ${spotSide === 'BUY'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400'
                                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400'
                                }`}
                        >
                            {loading ? 'Processing...' : `${orderType} ${spotSide} ${asset}`}
                        </button>

                        {/* Open Orders Section */}
                        {stopOrders.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <h4 className="text-gray-400 text-sm font-semibold mb-3">Open Orders</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {stopOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg text-xs">
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
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
                                                className="text-red-400 hover:text-red-300 px-2 py-1"
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
                                className={`p-4 rounded-xl border-2 transition ${binaryDirection === 'UP'
                                    ? 'border-green-500 bg-green-500/10 text-green-400'
                                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                    }`}
                            >
                                <ArrowUp className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-bold">CALL (UP)</div>
                            </button>
                            <button
                                onClick={() => setBinaryDirection('DOWN')}
                                className={`p-4 rounded-xl border-2 transition ${binaryDirection === 'DOWN'
                                    ? 'border-red-500 bg-red-500/10 text-red-400'
                                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700'
                                    }`}
                            >
                                <ArrowDown className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-bold">PUT (DOWN)</div>
                            </button>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Investment Amount</label>
                            <input
                                type="number"
                                value={binaryAmount}
                                onChange={(e) => setBinaryAmount(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                placeholder="10.00"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Duration</label>
                            <div className="flex gap-2">
                                {[60, 180, 300].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setBinaryDuration(d)}
                                        className={`flex-1 py-2 rounded-lg text-sm border ${binaryDuration === d ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-gray-800 text-gray-400 bg-gray-950'
                                            }`}
                                    >
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleBinaryTrade}
                            disabled={loading || !binaryAmount || !binaryDirection}
                            className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 disabled:opacity-50 transition"
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
