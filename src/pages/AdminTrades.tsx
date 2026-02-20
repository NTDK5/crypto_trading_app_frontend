import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { adminService, SpotTrade, OrderItem, TradeSummary } from '../services/adminService'
import { StatusBadge } from '../components/admin/StatusBadge'
import ConfirmModal from '../components/admin/ConfirmModal'

type TabId = 'spot' | 'limit' | 'stop' | 'stoplimit'

const TABS: { id: TabId; label: string }[] = [
    { id: 'spot', label: 'Market Orders' },
    { id: 'limit', label: 'Limit Orders' },
    { id: 'stop', label: 'Stop Orders' },
    { id: 'stoplimit', label: 'Stop-Limit Orders' },
]

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT']

function SummaryBar({ summary }: { summary: TradeSummary | null }) {
    if (!summary) return null
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'Pending Orders', value: summary.pendingOrders.total, color: 'amber' },
                { label: '24h Volume', value: `$${summary.volume24h.toLocaleString('en', { maximumFractionDigits: 0 })}`, color: 'cyan' },
                { label: '24h Fees', value: `$${summary.fees24h.toFixed(2)}`, color: 'purple' },
                { label: 'Executed Trades', value: summary.spotTrades['EXECUTED'] ?? 0, color: 'emerald' },
            ].map(s => (
                <div key={s.label} className="bg-[#111827] border border-white/5 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                </div>
            ))}
        </div>
    )
}

export default function AdminTrades() {
    const [activeTab, setActiveTab] = useState<TabId>('spot')
    const [trades, setTrades] = useState<SpotTrade[]>([])
    const [orders, setOrders] = useState<OrderItem[]>([])
    const [summary, setSummary] = useState<TradeSummary | null>(null)
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [symbol, setSymbol] = useState('')
    const [side, setSide] = useState('')
    const [status, setStatus] = useState('')
    const [cancelTarget, setCancelTarget] = useState<OrderItem | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

    useEffect(() => {
        adminService.getTradeSummary().then(setSummary).catch(() => { })
    }, [])

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true)
        const params = { page, limit: 30, symbol: symbol || undefined, side: side || undefined, status: status || undefined }
        try {
            if (activeTab === 'spot') {
                const r = await adminService.getSpotTrades(params)
                setTrades(r.data); setOrders([])
                setPagination({ page, totalPages: r.pagination.totalPages, total: r.pagination.total })
            } else if (activeTab === 'limit') {
                const r = await adminService.getLimitOrders(params)
                setOrders(r.data); setTrades([])
                setPagination({ page, totalPages: r.pagination.totalPages, total: r.pagination.total })
            } else if (activeTab === 'stop') {
                const r = await adminService.getStopOrders(params)
                setOrders(r.data); setTrades([])
                setPagination({ page, totalPages: r.pagination.totalPages, total: r.pagination.total })
            } else {
                const r = await adminService.getStopLimitOrders(params)
                setOrders(r.data); setTrades([])
                setPagination({ page, totalPages: r.pagination.totalPages, total: r.pagination.total })
            }
        } catch { showToast('Failed to load data', false) }
        finally { setLoading(false) }
    }, [activeTab, symbol, side, status])

    useEffect(() => { fetchData(1) }, [fetchData])

    const handleCancel = async () => {
        if (!cancelTarget) return
        try {
            if (activeTab === 'limit') await adminService.cancelLimitOrder(cancelTarget.id)
            else if (activeTab === 'stop') await adminService.cancelStopOrder(cancelTarget.id)
            showToast('Order cancelled successfully')
            fetchData(pagination.page)
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Cancel failed', false)
        }
    }

    const displayRows = activeTab === 'spot' ? trades : orders

    return (
        <div className="p-8">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border ${toast.ok ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Trade Monitor</h1>
                <p className="text-slate-500 text-sm mt-1">All platform orders & trade history</p>
            </div>

            <SummaryBar summary={summary} />

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-white/[0.03] border border-white/5 rounded-lg p-1 w-fit">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <select value={symbol} onChange={e => setSymbol(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none">
                    <option value="">All Symbols</option>
                    {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={side} onChange={e => setSide(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none">
                    <option value="">All Sides</option>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none">
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="EXECUTED">Executed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Symbol</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Side</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                {activeTab === 'spot' ? 'Total (USDT)' : activeTab === 'limit' ? 'Limit Price' : 'Trigger Price'}
                            </th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                            {(activeTab === 'limit' || activeTab === 'stop') && (
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="py-16 text-center text-slate-600 text-sm">Loading…</td></tr>
                        ) : displayRows.length === 0 ? (
                            <tr><td colSpan={8} className="py-16 text-center text-slate-600 text-sm">No records found</td></tr>
                        ) : activeTab === 'spot' ? (
                            (trades as SpotTrade[]).map(t => (
                                <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-2.5 text-xs text-slate-400">{t.user?.email || t.userId.substring(0, 8)}</td>
                                    <td className="px-4 py-2.5 text-xs text-white font-medium">{t.symbol}</td>
                                    <td className="px-4 py-2.5"><StatusBadge status={t.side} /></td>
                                    <td className="px-4 py-2.5 text-xs text-slate-300">{Number(t.quantity).toFixed(6)}</td>
                                    <td className="px-4 py-2.5 text-xs text-white font-medium">${Number(t.quoteAmount).toFixed(2)}</td>
                                    <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                                    <td className="px-4 py-2.5 text-[10px] text-slate-600">{new Date(t.createdAt).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            (orders as OrderItem[]).map(o => (
                                <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-2.5 text-xs text-slate-400">{o.user?.email || o.userId.substring(0, 8)}</td>
                                    <td className="px-4 py-2.5 text-xs text-white font-medium">{o.symbol}</td>
                                    <td className="px-4 py-2.5"><StatusBadge status={o.side} /></td>
                                    <td className="px-4 py-2.5 text-xs text-slate-300">{Number(o.quantity).toFixed(6)}</td>
                                    <td className="px-4 py-2.5 text-xs text-white font-medium">
                                        {o.limitPrice ? `$${Number(o.limitPrice).toFixed(2)}` : o.triggerPrice ? `$${Number(o.triggerPrice).toFixed(2)}` : o.stopPrice ? `$${Number(o.stopPrice).toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                                    <td className="px-4 py-2.5 text-[10px] text-slate-600">{new Date(o.createdAt).toLocaleString()}</td>
                                    {(activeTab === 'limit' || activeTab === 'stop') && (
                                        <td className="px-4 py-2.5">
                                            {o.status === 'PENDING' && (
                                                <button onClick={() => setCancelTarget(o)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded transition-colors">
                                                    <XCircle size={11} /> Cancel
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                        <p className="text-xs text-slate-600">Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchData(pagination.page - 1)} disabled={pagination.page === 1}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => fetchData(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancel}
                title="Cancel Order"
                message={`Cancel ${activeTab} order for ${cancelTarget?.user?.email || cancelTarget?.userId}? Locked funds will be returned.`}
                confirmText="Cancel Order"
                variant="warning"
            />
        </div>
    )
}
