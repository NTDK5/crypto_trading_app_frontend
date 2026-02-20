import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminService, AdminTransaction } from '../services/adminService'
import { StatusBadge } from '../components/admin/StatusBadge'

type TabId = 'pending-deposits' | 'pending-withdrawals' | 'history'

interface ModalState {
    type: 'approve-deposit' | 'reject-deposit' | 'approve-withdrawal' | 'reject-withdrawal'
    transaction: AdminTransaction
}

export default function AdminTransactions() {
    const [activeTab, setActiveTab] = useState<TabId>('pending-deposits')
    const [deposits, setDeposits] = useState<AdminTransaction[]>([])
    const [withdrawals, setWithdrawals] = useState<AdminTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<ModalState | null>(null)
    const [inputValue, setInputValue] = useState('')
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [d, w] = await Promise.allSettled([
                adminService.getPendingDeposits(),
                adminService.getPendingWithdrawals(),
            ])
            if (d.status === 'fulfilled') setDeposits(d.value)
            if (w.status === 'fulfilled') setWithdrawals(w.value)
        } catch { }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const handleConfirm = async () => {
        if (!modal) return
        setActionLoading(true)
        try {
            if (modal.type === 'approve-deposit') await adminService.approveDeposit(modal.transaction.id, inputValue)
            else if (modal.type === 'reject-deposit') await adminService.rejectDeposit(modal.transaction.id, inputValue)
            else if (modal.type === 'approve-withdrawal') await adminService.approveWithdrawal(modal.transaction.id, inputValue)
            else if (modal.type === 'reject-withdrawal') await adminService.rejectWithdrawal(modal.transaction.id, inputValue)
            showToast('Action completed')
            setModal(null); setInputValue('')
            fetchAll()
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Action failed', false)
        } finally { setActionLoading(false) }
    }

    const isApproval = modal?.type === 'approve-withdrawal' || modal?.type === 'approve-deposit'
    const isRejection = modal?.type.includes('reject')

    const tabs: { id: TabId; label: string; count?: number }[] = [
        { id: 'pending-deposits', label: 'Pending Deposits', count: deposits.length },
        { id: 'pending-withdrawals', label: 'Pending Withdrawals', count: withdrawals.length },
        { id: 'history', label: 'History' },
    ]

    const [history, setHistory] = useState<AdminTransaction[]>([])
    const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

    const fetchHistory = useCallback(async (page = 1) => {
        if (activeTab !== 'history') return
        setLoading(true)
        try {
            const { data, pagination } = await adminService.getTransactionHistory({ page, limit: 20 })
            setHistory(data)
            setHistoryPagination(pagination)
        } catch { }
        finally { setLoading(false) }
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'history') fetchHistory(1)
    }, [activeTab, fetchHistory])

    const currentData = activeTab === 'pending-deposits' ? deposits
        : activeTab === 'pending-withdrawals' ? withdrawals : history

    return (
        <div className="p-8">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border ${toast.ok ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Financial Control</h1>
                <p className="text-slate-500 text-sm mt-1">Approve or reject deposits and withdrawals</p>
            </div>

            {/* Pending Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`bg-[#111827] border rounded-xl px-5 py-4 ${deposits.length > 0 ? 'border-amber-500/20' : 'border-white/5'}`}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pending Deposits</p>
                    <p className="text-3xl font-bold text-white">{deposits.length}</p>
                    {deposits.length > 0 && <p className="text-xs text-amber-400 mt-1">Requires review</p>}
                </div>
                <div className={`bg-[#111827] border rounded-xl px-5 py-4 ${withdrawals.length > 0 ? 'border-amber-500/20' : 'border-white/5'}`}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pending Withdrawals</p>
                    <p className="text-3xl font-bold text-white">{withdrawals.length}</p>
                    {withdrawals.length > 0 && <p className="text-xs text-amber-400 mt-1">Requires review</p>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-white/[0.03] border border-white/5 rounded-lg p-1 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        {t.label}
                        {(t.count ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full">{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            {activeTab !== 'history' && (
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="py-16 text-center text-slate-600 text-sm">Loading…</td></tr>
                        ) : currentData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
                                    <CheckCircle size={32} className="text-emerald-500/40 mx-auto mb-2" />
                                    <p className="text-slate-600 text-sm">No pending {activeTab === 'pending-deposits' ? 'deposits' : 'withdrawals'}</p>
                                </td>
                            </tr>
                        ) : currentData.map(txn => (
                            <tr key={txn.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                <td className="px-4 py-3 text-xs text-slate-400">{txn.user?.email || txn.userId?.substring(0, 12)}</td>
                                <td className="px-4 py-3"><StatusBadge status={txn.type} /></td>
                                <td className="px-4 py-3 text-xs text-white font-semibold">{Number(txn.amount).toFixed(2)}</td>
                                <td className="px-4 py-3 text-xs text-slate-400">{txn.asset}</td>
                                <td className="px-4 py-3"><StatusBadge status={txn.status} dot /></td>
                                <td className="px-4 py-3 text-[10px] text-slate-600">{new Date(txn.createdAt).toLocaleString()}</td>
                                {activeTab !== 'history' && (
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setModal({ type: activeTab === 'pending-deposits' ? 'approve-deposit' : 'approve-withdrawal', transaction: txn })}
                                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded transition-colors">
                                                <CheckCircle size={11} /> Approve
                                            </button>
                                            <button
                                                onClick={() => setModal({ type: activeTab === 'pending-deposits' ? 'reject-deposit' : 'reject-withdrawal', transaction: txn })}
                                                className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded transition-colors">
                                                <XCircle size={11} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {activeTab === 'history' && historyPagination.totalPages > 1 && (
                <div className="mt-4 px-4 py-3 flex items-center justify-between bg-[#111827] border border-white/5 rounded-xl">
                    <p className="text-xs text-slate-600">
                        Page {historyPagination.page} of {historyPagination.totalPages} · {historyPagination.total} transactions
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => fetchHistory(historyPagination.page - 1)} disabled={historyPagination.page === 1}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => fetchHistory(historyPagination.page + 1)} disabled={historyPagination.page === historyPagination.totalPages}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => { setModal(null); setInputValue('') }} />
                    <div className="relative bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className={`font-semibold mb-2 ${isApproval ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isApproval ? '✓ Approve' : '✕ Reject'} {modal.transaction.type}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            {Number(modal.transaction.amount).toFixed(2)} {modal.transaction.asset} for {modal.transaction.user?.email}
                        </p>
                        <div className="mb-4">
                            <label className="text-xs text-slate-500 mb-1.5 block">
                                {isApproval && modal.type === 'approve-withdrawal' ? 'Transaction Hash (optional)' : 'Notes (optional)'}
                                {isRejection && ' — Rejection reason (optional)'}
                            </label>
                            <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                                placeholder={isApproval && modal.type === 'approve-withdrawal' ? '0x...' : 'Add notes…'}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20" />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setModal(null); setInputValue('') }} className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg">Cancel</button>
                            <button onClick={handleConfirm} disabled={actionLoading}
                                className={`px-4 py-2 text-sm rounded-lg font-medium text-white disabled:opacity-40 transition-colors ${isApproval ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {actionLoading ? 'Processing…' : isApproval ? 'Confirm Approval' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
