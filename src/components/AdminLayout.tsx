import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
    const { logout, user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-950 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 fixed h-full flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-800">
                    <Shield className="w-6 h-6 text-red-500 mr-2" />
                    <span className="font-bold text-xl tracking-tight">Admin<span className="text-gray-400">Panel</span></span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-red-500' : 'group-hover:text-white'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold border border-red-500/30">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-gray-500">Super Admin</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 flex-1">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
