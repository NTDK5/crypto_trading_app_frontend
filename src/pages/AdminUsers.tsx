import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, X, DollarSign, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { adminService, AdminUser } from '../services/adminService'
import { StatusBadge } from '../components/admin/StatusBadge'

interface ActionModal {
    type: 'freeze-trading' | 'unfreeze-trading' | 'freeze-withdrawals' | 'unfreeze-withdrawals' | 'suspend' | 'activate' | 'reset-fund-password' | 'add-note'
    userId: string
    userName: string
}

function AdjustBalanceModal({ user, onClose, onSuccess }: { user: AdminUser; onClose: () => void; onSuccess: () => void }) {
    const [asset, setAsset] = useState('USDT')
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !reason) return
        setLoading(true)
        try {
            await adminService.adjustUserBalance(user.id, asset, parseFloat(amount), reason)
            onSuccess()
            onClose()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Adjustment failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                <h3 className="text-white font-semibold mb-4">Adjust Balance: {user.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block">Asset</label>
                        <select
                            value={asset}
                            onChange={e => setAsset(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                        >
                            <option value="USDT">USDT</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block">Amount (Positive to add, Negative to deduct)</label>
                        <input
                            type="number" step="any"
                            value={amount} onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block">Reason</label>
                        <textarea
                            value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Reason for adjustment..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading || !amount || !reason}
                            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-40 transition-colors"
                        >
                            {loading ? 'Processing...' : 'Apply Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function UserSlideOver({ user, onClose, onAction }: { user: AdminUser; onClose: () => void; onAction: (type: string) => void }) {

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-[460px] bg-[#0d1117] border-l border-white/10 h-full overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-[#0d1117] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-white font-semibold">{user.name}</h2>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Status */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-600 mb-1">Status</p>
                            <StatusBadge status={user.isActive ? 'ACTIVE' : 'DISABLED'} dot />
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-600 mb-1">Trading</p>
                            <StatusBadge status={user.flags?.tradingFrozen ? 'DISABLED' : 'ACTIVE'} dot />
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-600 mb-1">Withdrawals</p>
                            <StatusBadge status={user.flags?.withdrawalsFrozen ? 'DISABLED' : 'ACTIVE'} dot />
                        </div>
                    </div>

                    {/* Wallets */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Balances</p>
                        <div className="space-y-2">
                            {user.wallets?.map(w => (
                                <div key={w.asset} className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] border border-white/5 rounded-lg">
                                    <span className="text-xs font-medium text-white">{w.asset}</span>
                                    <div className="text-right">
                                        <p className="text-xs text-white font-medium">{(w.balance).toFixed(6)}</p>
                                        {w.lockedBalance > 0 && <p className="text-[10px] text-amber-400">+{(w.lockedBalance).toFixed(6)} locked</p>}
                                    </div>
                                </div>
                            ))}
                            {(!user.wallets || user.wallets.length === 0) && (
                                <p className="text-slate-600 text-sm text-center py-4">No wallets found</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                            {!user.flags?.tradingFrozen ? (
                                <button onClick={() => onAction('freeze-trading')} className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-lg transition-colors">
                                    <Lock size={12} /> Freeze Trading
                                </button>
                            ) : (
                                <button onClick={() => onAction('unfreeze-trading')} className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-colors">
                                    <Unlock size={12} /> Unfreeze Trading
                                </button>
                            )}
                            {!user.flags?.withdrawalsFrozen ? (
                                <button onClick={() => onAction('freeze-withdrawals')} className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-lg transition-colors">
                                    <Lock size={12} /> Freeze Withdrawals
                                </button>
                            ) : (
                                <button onClick={() => onAction('unfreeze-withdrawals')} className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-colors">
                                    <Unlock size={12} /> Unfreeze Withdrawals
                                </button>
                            )}
                            {user.isActive ? (
                                <button onClick={() => onAction('suspend')} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg transition-colors">
                                    <X size={12} /> Suspend Account
                                </button>
                            ) : (
                                <button onClick={() => onAction('activate')} className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-colors">
                                    <Unlock size={12} /> Activate Account
                                </button>
                            )}
                            <button onClick={() => onAction('reset-fund-password')} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                                <Lock size={12} /> Reset Fund Pwd
                            </button>
                            <button onClick={() => onAction('adjust-balance')} className="flex items-center gap-2 px-3 py-2 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-lg transition-colors">
                                <DollarSign size={12} /> Adjust Balance
                            </button>
                        </div>
                    </div>

                    {/* Flags / Notes */}
                    {user.flags?.flagReason && (
                        <div className="px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-[10px] text-amber-400 font-semibold mb-1">⚠ FLAG REASON</p>
                            <p className="text-xs text-amber-300">{user.flags.flagReason}</p>
                        </div>
                    )}

                    {/* Recent Trades */}
                    {user.recentTrades && user.recentTrades.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Trades</p>
                            <div className="space-y-1.5">
                                {user.recentTrades.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg border border-white/5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={t.side} />
                                            <span className="text-slate-400">{t.symbol}</span>
                                        </div>
                                        <span className="text-white font-medium">${t.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    {user.recentTransactions && user.recentTransactions.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Transactions</p>
                            <div className="space-y-1.5">
                                {user.recentTransactions.slice(0, 5).map(t => (
                                    <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-lg border border-white/5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={t.type} />
                                            <StatusBadge status={t.status} />
                                        </div>
                                        <span className="text-white font-medium">${t.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-[10px] text-slate-700 pt-2 border-t border-white/5">
                        Member since {new Date(user.createdAt).toLocaleDateString()} · ID: {user.id}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterFrozen, setFilterFrozen] = useState<string>('')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [actionModal, setActionModal] = useState<ActionModal | null>(null)
    const [reasonInput, setReasonInput] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params: any = { page, limit: 20 }
            if (search) params.search = search
            if (filterFrozen === 'trading') params.tradingFrozen = true
            if (filterFrozen === 'withdrawals') params.withdrawalsFrozen = true
            const { users: u, pagination: p } = await adminService.getUsers(params)
            setUsers(u)
            setPagination(p)
        } catch { showToast('Failed to load users', 'error') }
        finally { setLoading(false) }
    }, [search, filterFrozen])

    useEffect(() => { fetchUsers(1) }, [fetchUsers])

    const handleRowClick = async (user: AdminUser) => {
        const detail = await adminService.getUserDetail(user.id).catch(() => user)
        setSelectedUser(detail)
    }

    const handleAction = async (type: string) => {
        if (!selectedUser) return
        setActionModal({ type: type as any, userId: selectedUser.id, userName: selectedUser.name || selectedUser.email })
    }

    const executeAction = async () => {
        if (!actionModal || !selectedUser) return
        setActionLoading(true)
        try {
            if (actionModal.type === 'freeze-trading') await adminService.freezeTrading(actionModal.userId, reasonInput)
            if (actionModal.type === 'unfreeze-trading') await adminService.unfreezeTrading(actionModal.userId)
            if (actionModal.type === 'freeze-withdrawals') await adminService.freezeWithdrawals(actionModal.userId, reasonInput)
            if (actionModal.type === 'unfreeze-withdrawals') await adminService.unfreezeWithdrawals(actionModal.userId)
            if (actionModal.type === 'suspend') await adminService.suspendUser(actionModal.userId, reasonInput)
            if (actionModal.type === 'activate') await adminService.activateUser(actionModal.userId)
            if (actionModal.type === 'reset-fund-password') await adminService.resetFundPassword(actionModal.userId)

            showToast('Action completed successfully')
            setActionModal(null)
            setReasonInput('')
            const updated = await adminService.getUserDetail(selectedUser.id)
            setSelectedUser(updated)
            fetchUsers(pagination.page)
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Action failed', 'error')
        } finally { setActionLoading(false) }
    }

    const [showAdjustBalance, setShowAdjustBalance] = useState(false)

    const handleSlideOverAction = (type: string) => {
        if (type === 'adjust-balance') {
            setShowAdjustBalance(true)
        } else {
            handleAction(type)
        }
    }

    const requiresReason = actionModal?.type === 'freeze-trading' ||
        actionModal?.type === 'freeze-withdrawals' ||
        actionModal?.type === 'suspend'

    return (
        <div className="p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">{(pagination?.total || 0).toLocaleString()} users registered</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text" placeholder="Search by email or name…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/20"
                    />
                </div>
                <select value={filterFrozen} onChange={e => setFilterFrozen(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none">
                    <option value="">All Users</option>
                    <option value="trading">Trading Frozen</option>
                    <option value="withdrawals">Withdrawals Frozen</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">USDT Balance</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trading</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Withdrawals</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">Loading users…</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">No users found</td></tr>
                        ) : users.map(user => {
                            const usdtWallet = user.wallets?.find(w => w.asset === 'USDT')
                            return (
                                <tr key={user.id} onClick={() => handleRowClick(user)}
                                    className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold border border-blue-500/20 shrink-0">
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-white truncate">{user.name || '—'}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-white font-medium">
                                        {usdtWallet ? `$${(usdtWallet.balance).toFixed(2)}` : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={user.flags?.tradingFrozen ? 'DISABLED' : 'ACTIVE'} dot />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={user.flags?.withdrawalsFrozen ? 'DISABLED' : 'ACTIVE'} dot />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={user.isActive ? 'ACTIVE' : 'DISABLED'} dot />
                                    </td>
                                    <td className="px-4 py-3 text-[10px] text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                        <p className="text-xs text-slate-600">
                            Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-Over */}
            {selectedUser && (
                <UserSlideOver user={selectedUser} onClose={() => setSelectedUser(null)} onAction={handleSlideOverAction} />
            )}

            {showAdjustBalance && selectedUser && (
                <AdjustBalanceModal
                    user={selectedUser}
                    onClose={() => setShowAdjustBalance(false)}
                    onSuccess={() => {
                        showToast('Balance adjusted successfully')
                        fetchUsers(pagination.page)
                        adminService.getUserDetail(selectedUser.id).then(setSelectedUser)
                    }}
                />
            )}

            {/* Action Confirm Modal */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setActionModal(null)} />
                    <div className="relative bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-400" />
                            Confirm: {actionModal.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            This action will affect <strong className="text-white">{actionModal.userName}</strong>.
                        </p>
                        {requiresReason && (
                            <div className="mb-4">
                                <label className="text-xs text-slate-500 mb-1.5 block">Reason (required)</label>
                                <input
                                    value={reasonInput} onChange={e => setReasonInput(e.target.value)}
                                    placeholder="Enter reason for this action…"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                />
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => { setActionModal(null); setReasonInput('') }}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg">Cancel</button>
                            <button onClick={executeAction}
                                disabled={actionLoading || (requiresReason && !reasonInput.trim())}
                                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-40 transition-colors">
                                {actionLoading ? 'Processing…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
