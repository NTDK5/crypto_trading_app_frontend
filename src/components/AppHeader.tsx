import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Wallet, BarChart3, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { walletService, WalletBalance } from '../services/walletService'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Trade', href: '/app/trade', icon: TrendingUp },
  { name: 'Market', href: '/app/market', icon: BarChart3 },
  { name: 'Wallet', href: '/app/wallet', icon: Wallet },
]

export default function AppHeader() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [balance, setBalance] = useState<WalletBalance | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balances = await walletService.getBalances()
        if (Array.isArray(balances)) {
          const usdtBalance = balances.find((b) => b.asset === 'USDT') || balances[0]
          setBalance(usdtBalance || null)
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }
    fetchBalance()

    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/90 backdrop-blur-xl py-3 shadow-lg shadow-cyan-500/10'
          : 'bg-black/60 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/app/dashboard" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                CryptoXD
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-gray-300 hover:text-cyan-400'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-lg border border-cyan-500/30"></div>
                  )}
                  <div className="relative flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Right Section - Balance & User */}
          <div className="flex items-center space-x-4">
            {/* Balance Display */}
            {balance && (
              <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-sm font-bold text-white">
                    {balance.available.toFixed(2)} {balance.asset}
                  </p>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg group">
              <User className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center justify-around border-t border-gray-800/50 pt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}







