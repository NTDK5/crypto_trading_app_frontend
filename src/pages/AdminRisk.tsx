import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { adminService, PlatformBalance, ExposureReport } from '../services/adminService'
import { StatusBadge } from '../components/admin/StatusBadge'

export default function AdminRisk() {
    const [balances, setBalances] = useState<PlatformBalance[]>([])
    const [exposure, setExposure] = useState<ExposureReport | null>(null)
    const [openOrders, setOpenOrders] = useState<any>(null)
    const [largeTransactions, setLargeTransactions] = useState<any>(null)
    const [threshold, setThreshold] = useState(10000)
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [b, e, o, l] = await Promise.allSettled([
                adminService.getPlatformBalances(),
                adminService.getExposure(),
                adminService.getOpenOrdersSummary(),
                adminService.getLargeTransactions(threshold),
            ])
            if (b.status === 'fulfilled') setBalances(b.value)
            if (e.status === 'fulfilled') setExposure(e.value)
            if (o.status === 'fulfilled') setOpenOrders(o.value)
            if (l.status === 'fulfilled') setLargeTransactions(l.value)
        } catch { }
        finally { setLoading(false) }
    }, [threshold])

    useEffect(() => { fetchAll() }, [fetchAll])

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Risk Monitor</h1>
                    <p className="text-slate-500 text-sm mt-1">Platform exposure, locked funds & large transactions</p>
                </div>
                <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Platform Balances */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Platform Holdings</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-4 h-24 animate-pulse" />
                        ))
                    ) : balances.map(b => (
                        <div key={b.asset} className="bg-[#111827] border border-white/5 rounded-xl p-4">
                            <p className="text-[10px] text-slate-500 font-semibold mb-2">{b.asset}</p>
                            <p className="text-lg font-bold text-white">{b.totalBalance.toLocaleString('en', { maximumFractionDigits: 4 })}</p>
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-slate-600">Available</span>
                                <span className="text-[10px] text-emerald-400">{b.available.toLocaleString('en', { maximumFractionDigits: 4 })}</span>
                            </div>
                            {b.totalLocked > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-600">Locked</span>
                                    <span className="text-[10px] text-amber-400">{b.totalLocked.toLocaleString('en', { maximumFractionDigits: 4 })}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Net Exposure by Asset */}
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Net Exposure by Asset</h2>
                <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Buys</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Sells</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Net Position</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Direction</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!exposure || !exposure.exposures || exposure.exposures.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-slate-600 text-sm">No exposure data available</td></tr>
                            ) : exposure.exposures.map(e => (
                                <tr key={e.asset} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-3 text-xs font-semibold text-white">{e.asset}</td>
                                    <td className="px-4 py-3 text-xs text-emerald-400">{Number(e.totalBuy || 0).toFixed(4)}</td>
                                    <td className="px-4 py-3 text-xs text-red-400">{Number(e.totalSell || 0).toFixed(4)}</td>
                                    <td className={`px-4 py-3 text-xs font-semibold ${Number(e.netExposure) > 0 ? 'text-emerald-400' : Number(e.netExposure) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {Number(e.netExposure || 0).toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {Number(e.netExposure) > 0 ? (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                                                <TrendingUp size={12} /> Long
                                            </span>
                                        ) : Number(e.netExposure) < 0 ? (
                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                <TrendingDown size={12} /> Short
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-600">Neutral</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Locked Funds Summary */}
            {openOrders?.lockedByAsset && openOrders.lockedByAsset.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Locked in Pending Orders
                        <span className="ml-2 text-slate-600 font-normal normal-case">{openOrders.summary?.totalPendingLimitOrders + openOrders.summary?.totalPendingStopOrders} pending orders total</span>
                    </h2>
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                        {openOrders.lockedByAsset.map((l: any) => (
                            <div key={l.asset} className="bg-[#111827] border border-amber-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-slate-500">{l.asset}</p>
                                <p className="text-base font-bold text-amber-400">{l.totalLocked.toFixed(4)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Large Transactions */}
            <div>
                <div className="flex items-center gap-4 mb-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-400" /> Large Transactions
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">Threshold:</span>
                        <select value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                            className="bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none">
                            <option value={1000}>$1,000</option>
                            <option value={5000}>$5,000</option>
                            <option value={10000}>$10,000</option>
                            <option value={50000}>$50,000</option>
                            <option value={100000}>$100,000</option>
                        </select>
                    </div>
                </div>

                <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount (USD)</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="py-12 text-center text-slate-600 text-sm">Loading…</td></tr>
                            ) : (!largeTransactions || (largeTransactions.largeTrades?.length === 0 && largeTransactions.largeTransactions?.length === 0)) ? (
                                <tr><td colSpan={5} className="py-12 text-center text-slate-600 text-sm">No transactions above ${threshold.toLocaleString()}</td></tr>
                            ) : [
                                ...(largeTransactions?.largeTrades || []),
                                ...(largeTransactions?.largeTransactions || []),
                            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((item: any) => (
                                    <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                        <td className="px-4 py-3"><StatusBadge status={item.type} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{item.userEmail || item.userId?.substring(0, 12)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">
                                            {item.symbol ? `${item.side} ${item.symbol}` : `${item.asset}`}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-amber-400">${Number(item.amount).toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-[10px] text-slate-600">{new Date(item.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
