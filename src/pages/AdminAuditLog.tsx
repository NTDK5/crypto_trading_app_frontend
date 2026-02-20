import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { adminService, AuditLog } from '../services/adminService'

const ACTION_TYPES = [
    'FREEZE_USER_TRADING', 'UNFREEZE_USER_TRADING', 'FREEZE_USER_WITHDRAWALS',
    'APPROVE_DEPOSIT', 'REJECT_DEPOSIT', 'APPROVE_WITHDRAWAL', 'REJECT_WITHDRAWAL',
    'UPDATE_CONFIG', 'PAUSE_PLATFORM_TRADING', 'RESUME_PLATFORM_TRADING',
    'ADD_USER_NOTE', 'CANCEL_ORDER', 'SET_EXPOSURE_LIMIT',
]

const actionSeverity = (type: string): 'danger' | 'warning' | 'info' => {
    if (['FREEZE_USER_TRADING', 'FREEZE_USER_WITHDRAWALS', 'PAUSE_PLATFORM_TRADING', 'REJECT_DEPOSIT', 'REJECT_WITHDRAWAL'].includes(type)) return 'danger'
    if (['APPROVE_DEPOSIT', 'APPROVE_WITHDRAWAL', 'CANCEL_ORDER', 'SET_EXPOSURE_LIMIT'].includes(type)) return 'warning'
    return 'info'
}

const actionColor = (type: string) => {
    const sev = actionSeverity(type)
    if (sev === 'danger') return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (sev === 'warning') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
}

export default function AdminAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [actionType, setActionType] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [adminId, setAdminId] = useState('')
    const [expandedLog, setExpandedLog] = useState<string | null>(null)

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params: any = { page, limit: 50 }
            if (actionType) params.actionType = actionType
            if (from) params.from = new Date(from).toISOString()
            if (to) params.to = new Date(to).toISOString()
            if (adminId) params.adminId = adminId
            const { data, pagination: pg } = await adminService.getAuditLogs(params)
            setLogs(data)
            if (pg) setPagination({ page, totalPages: pg.totalPages, total: pg.total })
            else setPagination(prev => ({ ...prev, page }))
        } catch { }
        finally { setLoading(false) }
    }, [actionType, from, to, adminId])

    useEffect(() => { fetchLogs(1) }, [fetchLogs])

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Audit Log</h1>
                <p className="text-slate-500 text-sm mt-1">Immutable record of all admin actions</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <select value={actionType} onChange={e => setActionType(e.target.value)}
                    className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none">
                    <option value="">All Action Types</option>
                    {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600">From</label>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600">To</label>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none" />
                </div>
                <button onClick={() => { setActionType(''); setFrom(''); setTo(''); setAdminId('') }}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-white border border-white/10 rounded-lg transition-colors">
                    Clear Filters
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                            <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center text-slate-600 text-sm">Loading…</td></tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <Shield size={32} className="text-slate-700 mx-auto mb-2" />
                                    <p className="text-slate-600 text-sm">No audit log entries found</p>
                                </td>
                            </tr>
                        ) : logs.map(log => (
                            <>
                                <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer last:border-0"
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                    <td className="px-4 py-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-white">{log.admin?.email || log.adminId?.substring(0, 12)}</p>
                                        {log.admin?.adminRole && <p className="text-[10px] text-slate-600">{log.admin.adminRole}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded border ${actionColor(log.actionType)}`}>
                                            {(log.actionType || 'UNKNOWN_ACTION').replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-slate-400">{log.targetType}</p>
                                        {log.targetId && <p className="text-[10px] text-slate-600 font-mono">{log.targetId.substring(0, 12)}…</p>}
                                    </td>
                                    <td className="px-4 py-3 text-[10px] text-slate-600 font-mono">{log.ipAddress || '—'}</td>
                                    <td className="px-4 py-3 text-[10px] text-slate-500">
                                        {expandedLog === log.id ? '▲ Hide' : '▼ Show'}
                                    </td>
                                </tr>
                                {expandedLog === log.id && (
                                    <tr key={`${log.id}-expanded`} className="border-b border-white/[0.04] bg-white/[0.015]">
                                        <td colSpan={6} className="px-4 py-3">
                                            <pre className="text-[10px] text-slate-400 bg-black/20 rounded p-3 overflow-x-auto">
                                                {JSON.stringify(log.metadata || {}, null, 2)}
                                            </pre>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                        <p className="text-xs text-slate-600">Page {pagination.page} of {pagination.totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page === 1}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
