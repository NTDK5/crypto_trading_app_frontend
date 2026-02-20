import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield,
    AlertTriangle, BookOpen, TrendingUp
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { adminService } from '../services/adminService'

const navItems = [
    {
        section: 'Overview', items: [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        section: 'Users & Finance', items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
        ]
    },
    {
        section: 'Trading', items: [
            { name: 'Trades & Orders', href: '/admin/trades', icon: TrendingUp },
        ]
    },
    {
        section: 'Risk & Control', items: [
            { name: 'Risk Monitor', href: '/admin/risk', icon: AlertTriangle },
            { name: 'System Config', href: '/admin/config', icon: Settings },
            { name: 'Audit Log', href: '/admin/audit-log', icon: BookOpen },
        ]
    },
]

export default function AdminLayout() {
    const { logout, user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [tradingEnabled, setTradingEnabled] = useState<boolean | null>(null)

    useEffect(() => {
        adminService.getSystemHealth().then(h => {
            setTradingEnabled(h.status !== 'CRITICAL')
        }).catch(() => { })
        // check trading status once
        adminService.getDashboardMetrics().then(m => {
            setTradingEnabled(m.systemStatus?.tradingEnabled ?? true)
        }).catch(() => { })
    }, [location.pathname])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#111827] border-r border-white/5 fixed h-full flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <Shield className="w-4.5 h-4.5 text-red-400" size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white leading-tight">Admin Console</p>
                            <p className="text-[10px] text-slate-500 leading-tight">Operations Center</p>
                        </div>
                    </div>
                </div>

                {/* Trading Status */}
                {tradingEnabled !== null && (
                    <div className={`mx-4 mt-3 px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${tradingEnabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tradingEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        Trading {tradingEnabled ? 'Active' : 'Paused'}
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {navItems.map(group => (
                        <div key={group.section} className="mb-3">
                            <p className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                                {group.section}
                            </p>
                            {group.items.map(item => {
                                const Icon = item.icon
                                const isActive = location.pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon size={16} className={isActive ? 'text-red-400' : ''} />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm border border-red-500/30 shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 min-h-screen">
                <Outlet />
            </main>
        </div>
    )
}
