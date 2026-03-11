import { useState, useEffect, useMemo } from 'react'
import { marketService } from '../../services/marketService'
import { spotTradeService } from '../../services/spotTradeService'
import { walletService } from '../../services/walletService'
import { tradeService } from '../../services/tradeService'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface TradePanelProps {
    symbol?: string
    initialAsset?: string
    currentPrice?: number // optional live price fed from parent WebSocket
}

const DEFAULT_FEE_RATE = 0.002

export default function TradePanel({
    symbol: propSymbol,
    initialAsset = 'BTC',
    currentPrice: wsPrice,
}: TradePanelProps) {
    const [activeTab, setActiveTab] = useState<'spot' | 'binary'>('spot')

    const initialSymbol = propSymbol || `${initialAsset}USDT`
    const asset = propSymbol ? propSymbol.replace('USDT', '') : initialAsset

    // Live price – prefer WebSocket price from parent, fallback to polling
    const [polledPrice, setPolledPrice] = useState(0)
    const price = wsPrice && wsPrice > 0 ? wsPrice : polledPrice

    // Wallet balances
    const [usdtBalance, setUsdtBalance] = useState(0)
    const [baseBalance, setBaseBalance] = useState(0)

    // Spot state
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
    const [amount, setAmount] = useState('') // dollar amount for BUY, or base-asset qty for SELL

    // Binary state
    const [binaryDirection, setBinaryDirection] = useState<'UP' | 'DOWN' | null>(null)
    const [binaryAmount, setBinaryAmount] = useState('')
    const [binaryDuration, setBinaryDuration] = useState(60)

    const [loading, setLoading] = useState(false)
    const [tradingEnabled, setTradingEnabled] = useState(true)
    const [msg, setMsg] = useState<{ type: string; text: string }>({ type: '', text: '' })

    /* ── Fetch price + balances ─────────────────────────────────── */
    useEffect(() => {
        let cancelled = false
        const fetchData = async () => {
            try {
                const p = await marketService.getPrice(initialSymbol)
                if (!cancelled) setPolledPrice(p)

                const balances = await walletService.getBalances()
                const usdt = balances.find(b => b.asset === 'USDT')
                const base = balances.find(b => b.asset === asset)
                if (!cancelled) {
                    setUsdtBalance(usdt?.available || 0)
                    setBaseBalance(base?.available || 0)
                }

                const status = await spotTradeService.getTradingStatus()
                if (!cancelled) setTradingEnabled(status.enabled)
            } catch (e) {
                console.error(e)
            }
        }

        fetchData()
        // Only poll price if no WebSocket price is provided
        const interval = setInterval(fetchData, wsPrice ? 10000 : 3000)
        return () => {
            cancelled = true
            clearInterval(interval)
        }
    }, [initialSymbol, asset, wsPrice])

    /* ── Calculations ───────────────────────────────────────────── */
    const calc = useMemo(() => {
        const amt = parseFloat(amount) || 0

        if (side === 'BUY') {
            // amt is in USD
            const fee = amt * DEFAULT_FEE_RATE
            const total = amt + fee
            const coinQty = price > 0 ? amt / price : 0
            return { fee, total, coinQty, displayTotal: `${total.toFixed(2)} USDT` }
        } else {
            // amt is qty in base asset
            const usdValue = amt * price
            const fee = usdValue * DEFAULT_FEE_RATE
            const net = usdValue - fee
            return { fee, total: usdValue, coinQty: amt, displayTotal: `≈ ${net.toFixed(2)} USDT` }
        }
    }, [amount, price, side])

    /* ── Percentage shortcuts ───────────────────────────────────── */
    const handlePercent = (pct: number) => {
        if (side === 'BUY') {
            setAmount((usdtBalance * pct).toFixed(2))
        } else {
            const d = asset === 'BTC' || asset === 'ETH' ? 6 : 4
            setAmount((baseBalance * pct).toFixed(d))
        }
    }

    /* ── Spot trade ─────────────────────────────────────────────── */
    const handleSpot = async () => {
        setMsg({ type: '', text: '' })

        if (!tradingEnabled) {
            setMsg({ type: 'error', text: 'Trading is currently paused by the administrator.' })
            return
        }

        const amt = parseFloat(amount)
        if (!amount || isNaN(amt) || amt <= 0) {
            setMsg({ type: 'error', text: 'Please enter a valid amount.' })
            return
        }

        if (side === 'BUY' && calc.total > usdtBalance) {
            setMsg({ type: 'error', text: 'Insufficient USDT balance.' })
            return
        }
        if (side === 'SELL' && amt > baseBalance) {
            setMsg({ type: 'error', text: `Insufficient ${asset} balance.` })
            return
        }

        setLoading(true)
        try {
            await spotTradeService.placeTrade({
                symbol: `${asset}/USDT`,
                side,
                amount: amt,
            })

            setMsg({ type: 'success', text: `${side === 'BUY' ? 'Bought' : 'Sold'} successfully! ✓` })
            setAmount('')

            // Refresh balances
            const balances = await walletService.getBalances()
            const usdt = balances.find(b => b.asset === 'USDT')
            const base = balances.find(b => b.asset === asset)
            setUsdtBalance(usdt?.available || 0)
            setBaseBalance(base?.available || 0)
        } catch (e: any) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'Trade failed. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    /* ── Binary trade ───────────────────────────────────────────── */
    const handleBinary = async () => {
        if (!binaryAmount || !binaryDirection) return
        setLoading(true)
        setMsg({ type: '', text: '' })
        try {
            await tradeService.createTrade({
                asset: initialSymbol,
                direction: binaryDirection,
                amount: parseFloat(binaryAmount),
                duration: binaryDuration,
            })
            setMsg({ type: 'success', text: 'Position opened! ✓' })
            setBinaryAmount('')
            setBinaryDirection(null)
        } catch (e: any) {
            setMsg({ type: 'error', text: e.response?.data?.message || 'Trade failed.' })
        } finally {
            setLoading(false)
        }
    }

    const isSpotValid = useMemo(() => {
        const amt = parseFloat(amount) || 0
        if (amt <= 0) return false
        if (side === 'BUY') return calc.total <= usdtBalance
        return amt <= baseBalance
    }, [amount, side, calc, usdtBalance, baseBalance])

    const formatPrice = (p: number) =>
        p >= 1
            ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : p.toFixed(6)

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            {/* Tab bar */}
            <div className="flex gap-1.5 p-3 border-b border-gray-800">
                {(['spot', 'binary'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            }`}
                    >
                        {tab === 'spot' ? 'Buy / Sell' : 'Predict'}
                    </button>
                ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                {/* Pair + live price */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                            {asset}/USDT
                        </p>
                        <p className="text-2xl font-bold text-white tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            ${formatPrice(price)}
                        </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                        <p>USDT Balance</p>
                        <p className="text-cyan-400 font-semibold text-sm tabular-nums">{usdtBalance.toFixed(2)}</p>
                        {baseBalance > 0 && (
                            <>
                                <p className="mt-0.5">{asset} Balance</p>
                                <p className="text-indigo-400 font-semibold text-sm tabular-nums">
                                    {baseBalance.toFixed(asset === 'BTC' || asset === 'ETH' ? 6 : 4)}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* ── SPOT TAB ─────────────────────────────────────────── */}
                {activeTab === 'spot' ? (
                    <div className="space-y-4">
                        {/* Buy / Sell toggle */}
                        <div className="flex bg-gray-950 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => { setSide('BUY'); setAmount('') }}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${side === 'BUY'
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Buy {asset}
                            </button>
                            <button
                                onClick={() => { setSide('SELL'); setAmount('') }}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${side === 'SELL'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Sell {asset}
                            </button>
                        </div>

                        {/* Amount input */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {side === 'BUY' ? 'Amount to spend (USDT)' : `Quantity to sell (${asset})`}
                                </label>
                                <span className="text-xs text-gray-600">
                                    Max: {side === 'BUY'
                                        ? `$${usdtBalance.toFixed(2)}`
                                        : `${baseBalance.toFixed(asset === 'BTC' || asset === 'ETH' ? 6 : 4)} ${asset}`}
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder={side === 'BUY' ? '0.00' : '0.000000'}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3.5 text-white text-base font-medium focus:outline-none focus:border-cyan-500/60 transition placeholder:text-gray-700"
                                    style={{ boxShadow: amount ? '0 0 0 1px rgba(34,211,238,0.15)' : undefined }}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                                    {side === 'BUY' ? 'USDT' : asset}
                                </span>
                            </div>

                            {/* Percentage quick buttons */}
                            <div className="flex gap-2 mt-2">
                                {[25, 50, 75, 100].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => handlePercent(pct / 100)}
                                        className="flex-1 py-1.5 text-xs font-semibold bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary card */}
                        {parseFloat(amount) > 0 && price > 0 && (
                            <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 space-y-2.5">
                                {side === 'BUY' ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">You spend</span>
                                            <span className="text-white font-medium tabular-nums">${parseFloat(amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">You get ≈</span>
                                            <span className="text-cyan-400 font-semibold tabular-nums">{calc.coinQty.toFixed(6)} {asset}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Fee (0.2%)</span>
                                            <span className="text-gray-400 tabular-nums">${calc.fee.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                                            <span className="text-gray-400 font-medium">Total cost</span>
                                            <span className="text-white font-bold tabular-nums">${calc.total.toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">You sell</span>
                                            <span className="text-white font-medium tabular-nums">{parseFloat(amount).toFixed(6)} {asset}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Market value</span>
                                            <span className="text-white font-medium tabular-nums">${calc.total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Fee (0.2%)</span>
                                            <span className="text-gray-400 tabular-nums">${calc.fee.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                                            <span className="text-gray-400 font-medium">You receive</span>
                                            <span className="text-emerald-400 font-bold tabular-nums">{calc.displayTotal}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Trading paused banner */}
                        {!tradingEnabled && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold p-3 rounded-xl">
                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
                                Trading is currently paused by the administrator.
                            </div>
                        )}

                        {/* Message */}
                        {msg.text && (
                            <div className={`p-3 rounded-xl text-sm font-medium border ${msg.type === 'success'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {msg.text}
                            </div>
                        )}

                        {/* Action button */}
                        <button
                            onClick={handleSpot}
                            disabled={loading || !isSpotValid || !tradingEnabled}
                            className={`w-full py-4 rounded-xl font-bold text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${side === 'BUY'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500'
                                }`}
                            style={!loading && isSpotValid && tradingEnabled ? {
                                boxShadow: side === 'BUY'
                                    ? '0 4px 20px rgba(34, 197, 94, 0.4)'
                                    : '0 4px 20px rgba(239, 68, 68, 0.4)',
                            } : undefined}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing…
                                </span>
                            ) : !tradingEnabled ? (
                                'Trading Paused'
                            ) : (
                                `${side === 'BUY' ? 'Buy' : 'Sell'} ${asset} Now`
                            )}
                        </button>
                    </div>

                ) : (
                    /* ── BINARY TAB ─────────────────────────────────────────── */
                    <div className="space-y-4">
                        <p className="text-xs text-gray-500 text-center">
                            Predict whether the price will go UP or DOWN within the chosen time window.
                        </p>

                        {/* Direction buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setBinaryDirection('UP')}
                                className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all font-semibold ${binaryDirection === 'UP'
                                        ? 'border-green-500 bg-green-500/10 text-green-400 shadow-lg shadow-green-600/20'
                                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-green-500/30'
                                    }`}
                            >
                                <ArrowUpCircle className="w-8 h-8" />
                                <span className="text-base">UP ↑</span>
                            </button>
                            <button
                                onClick={() => setBinaryDirection('DOWN')}
                                className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition-all font-semibold ${binaryDirection === 'DOWN'
                                        ? 'border-red-500 bg-red-500/10 text-red-400 shadow-lg shadow-red-600/20'
                                        : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-red-500/30'
                                    }`}
                            >
                                <ArrowDownCircle className="w-8 h-8" />
                                <span className="text-base">DOWN ↓</span>
                            </button>
                        </div>

                        {/* Investment amount */}
                        <div>
                            <label className="text-xs font-medium text-gray-400 block mb-1.5">Investment Amount (USDT)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={binaryAmount}
                                    onChange={e => setBinaryAmount(e.target.value)}
                                    placeholder="Enter amount…"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-purple-500/60 transition placeholder:text-gray-700"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USDT</span>
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-xs font-medium text-gray-400 block mb-1.5">Duration</label>
                            <div className="flex gap-2">
                                {[
                                    { label: '1 min', value: 60 },
                                    { label: '3 min', value: 180 },
                                    { label: '5 min', value: 300 },
                                ].map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => setBinaryDuration(d.value)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${binaryDuration === d.value
                                                ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                                : 'border-gray-800 bg-gray-950 text-gray-500 hover:border-gray-700'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {msg.text && (
                            <div className={`p-3 rounded-xl text-sm font-medium border ${msg.type === 'success'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {msg.text}
                            </div>
                        )}

                        <button
                            onClick={handleBinary}
                            disabled={loading || !binaryAmount || !binaryDirection}
                            className="w-full py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            style={!loading && binaryAmount && binaryDirection ? {
                                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                            } : undefined}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing…
                                </span>
                            ) : `Predict ${binaryDirection || '…'}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
