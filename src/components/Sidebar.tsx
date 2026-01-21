import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Wallet, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: 'Trade', href: '/app/trade', icon: TrendingUp },
  { name: 'Market', href: '/app/market', icon: BarChart3 },
  { name: 'Wallet', href: '/app/wallet', icon: Wallet },
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      <div className="p-6 border-b border-dark-700">
        <h1 className="text-2xl font-bold text-primary-500">CryptoTrade</h1>
        <p className="text-sm text-gray-400 mt-1">Trading Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

