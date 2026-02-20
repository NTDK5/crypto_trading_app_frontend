import { useEffect, useState, useCallback } from 'react'
import {
    TrendingUp, Users, DollarSign,
    Activity, AlertCircle, Clock, RefreshCw,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { adminService, DashboardMetrics, PlatformStats, ActivityItem, SystemHealth } from '../services/adminService'
import { StatusBadge } from '../components/admin/StatusBadge'

const REFRESH_INTERVAL = 30_000

function StatCard({ label, value, sub, trend, icon: Icon, color = 'blue' }: {
    label: string; value: string | number; sub?: string; trend?: number;
    icon: any; color?: string
}) {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    }
    return (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
                    <Icon size={16} />
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <div className="flex items-center gap-2 mt-1">
                {sub && <p className="text-xs text-slate-500">{sub}</p>}
                {trend !== undefined && (
                    <span className={`text-xs flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(trend).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    )
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
    const getIcon = (type: string) => {
        if (type === 'TRADE') return <span className="text-blue-400">⇄</span>
        if (type === 'ADMIN_ACTION') return <span className="text-purple-400">🛡</span>
        return <span className="text-emerald-400">↕</span>
    }

    const getDescription = (item: ActivityItem) => {
        if (item.type === 'TRADE') {
            const d = item.details
            return `${d.side || ''} ${d.quantity || ''} ${d.symbol || ''} @ ${d.price || 'market'}`
        }
        if (item.type === 'ADMIN_ACTION') {
            return `${item.details.actionType || 'Action'} on ${item.details.targetType || 'entity'}`
        }
        return `${item.details.type || 'Transaction'} ${item.details.amount || ''} ${item.details.asset || ''}`
    }

    return (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {items.length === 0 && (
                <p className="text-slate-600 text-sm text-center py-8">No recent activity</p>
            )}
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg border border-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-sm shrink-0">
                        {getIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate">{getDescription(item)}</p>
                        <p className="text-[10px] text-slate-600">{item.user?.email || item.admin?.email || 'System'}</p>
                    </div>
                    <p className="text-[10px] text-slate-600 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            const [m, s, a, h] = await Promise.allSettled([
                adminService.getDashboardMetrics(),
                adminService.getPlatformStats('24h'),
                adminService.getRecentActivity(30),
                adminService.getSystemHealth(),
            ])
            if (m.status === 'fulfilled') setMetrics(m.value)
            if (s.status === 'fulfilled') setStats(s.value)
            if (a.status === 'fulfilled') setActivity(a.value)
            if (h.status === 'fulfilled') setHealth(h.value)
            setLastRefresh(new Date())
            setError(null)
        } catch {
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAll()
        const interval = setInterval(fetchAll, REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchAll])

    const totalUsers = metrics?.userStats?.total ?? 0
    const activeUsers = metrics?.userStats?.active ?? 0
    const pendingDeposits = metrics?.pendingCounts?.deposits ?? 0
    const pendingWithdrawals = metrics?.pendingCounts?.withdrawals ?? 0
    const volume24h = stats?.trades?.volume ?? 0
    const fees24h = stats?.fees?.total ?? 0

    // Get USDT stats from balances
    // const usdtBalance = metrics?.totalBalances?.['USDT'] ?? { balance: 0, total: 0 }
    const tradingEnabled = metrics?.systemStatus?.tradingEnabled ?? true

    const formatUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mission Control</h1>
                    <p className="text-slate-500 text-sm mt-1">Platform overview & real-time metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={tradingEnabled ? 'ACTIVE' : 'DISABLED'} size="md" dot />
                    <button
                        onClick={() => { setLoading(true); fetchAll() }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <p className="text-xs text-slate-600">
                        Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <StatCard label="Total Users" value={loading ? '–' : totalUsers.toLocaleString()} icon={Users} color="blue" />
                <StatCard label="Active Users" value={loading ? '–' : activeUsers.toLocaleString()} sub={`${totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(0) : 0}% of total`} icon={Activity} color="emerald" />
                <StatCard label="24h Volume" value={loading ? '–' : formatUSD(volume24h)} icon={TrendingUp} color="cyan" />
                <StatCard label="24h Fees" value={loading ? '–' : formatUSD(fees24h)} icon={DollarSign} color="purple" />
                <StatCard label="Pending Deposits" value={loading ? '–' : pendingDeposits} icon={ArrowDownRight} color={pendingDeposits > 0 ? 'amber' : 'emerald'} />
                <StatCard label="Pending Withdrawals" value={loading ? '–' : pendingWithdrawals} icon={ArrowUpRight} color={pendingWithdrawals > 0 ? 'amber' : 'emerald'} />
            </div>

            {/* Platform Balances + System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Platform Balances */}
                <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-400" />
                        Platform Balances
                    </h2>
                    {loading ? (
                        <div className="h-32 flex items-center justify-center text-slate-600 text-sm">Loading...</div>
                    ) : metrics?.totalBalances ? (
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(metrics.totalBalances).map(([asset, data]) => (
                                <div key={asset} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">{asset}</p>
                                        <p className="text-sm font-bold text-white">{parseFloat(String(data.total)).toLocaleString('en', { maximumFractionDigits: 4 })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-600">Locked</p>
                                        <p className="text-xs text-amber-400">{parseFloat(String(data.locked)).toLocaleString('en', { maximumFractionDigits: 4 })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-600 text-sm text-center py-8">No balance data available</p>
                    )}
                </div>

                {/* System Health */}
                <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-blue-400" />
                        System Health
                    </h2>
                    {health ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Overall Status</span>
                                <StatusBadge status={health.status} size="sm" dot />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Trading</span>
                                <StatusBadge status={tradingEnabled ? 'ACTIVE' : 'DISABLED'} size="sm" dot />
                            </div>
                            <div className="w-full border-t border-white/5 my-1" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Failed Trades (24h)</span>
                                <span className={`text-xs font-medium ${health.failedTrades24h > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {health.failedTrades24h}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Failed Txns (24h)</span>
                                <span className={`text-xs font-medium ${health.failedTransactions24h > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {health.failedTransactions24h}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Frozen Users</span>
                                <span className={`text-xs font-medium ${health.frozenUsers > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {health.frozenUsers}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-slate-600 text-sm">
                            {loading ? 'Loading...' : 'Health data unavailable'}
                        </div>
                    )}
                </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center justifybetween gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Live Activity Feed
                    <span className="ml-auto text-[10px] text-slate-600">Auto-refreshes every 30s</span>
                </h2>
                <ActivityFeed items={activity} />
            </div>
        </div>
    )
}
