import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpRightSquare ,
  User,
  Mail,
  Calendar
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { walletService } from '../services/walletService'
import { tradeService } from '../services/tradeService'

type TabType = 'dashboard' | 'identity' | 'history' | 'security'
type SecuritySubTab = 'login' | 'funds'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [activeSecurityTab, setActiveSecurityTab] = useState<SecuritySubTab>('login')
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Fund password states
  const [fundPassword, setFundPassword] = useState('')
  const [confirmFundPassword, setConfirmFundPassword] = useState('')
  const [currentFundPassword, setCurrentFundPassword] = useState('')
  const [showFundPassword, setShowFundPassword] = useState(false)
  const [showConfirmFundPassword, setShowConfirmFundPassword] = useState(false)
  const [showCurrentFundPassword, setShowCurrentFundPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    tradingVolume: 0,
    roi: 0,
    totalPnL: 0,
    trades: 0,
    wins: 0,
    winRate: 0,
    lastLogin: new Date().toLocaleDateString(),
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch wallet and trade data to calculate stats
      const balances = await walletService.getBalances()
      const trades = await tradeService.getUserTrades()
      
      const totalDeposits = 0 // TODO: Calculate from transactions
      const totalWithdrawals = 0 // TODO: Calculate from transactions
      const tradingVolume = trades.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      const wins = trades.filter(t => t.status === 'WON').length
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0
      const totalPnL = trades.reduce((sum, t) => sum + (t.profit || 0), 0)
      
      setStats({
        totalDeposits,
        totalWithdrawals,
        tradingVolume,
        roi: 0,
        totalPnL,
        trades: trades.length,
        wins,
        winRate,
        lastLogin: new Date().toLocaleDateString(),
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleUpdateLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      // TODO: Implement update login password endpoint
      setMessage({ type: 'success', text: 'Login password updated successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleSetFundPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    if (fundPassword.length < 8) {
      setMessage({ type: 'error', text: 'Fund password must be at least 8 characters' })
      setLoading(false)
      return
    }

    if (fundPassword !== confirmFundPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      await authService.setFundPassword(fundPassword)
      await refreshUser()
      setMessage({ type: 'success', text: 'Fund password set successfully' })
      setFundPassword('')
      setConfirmFundPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to set fund password' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFundPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    if (!currentFundPassword) {
      setMessage({ type: 'error', text: 'Current fund password is required' })
      setLoading(false)
      return
    }

    if (fundPassword.length < 8) {
      setMessage({ type: 'error', text: 'New fund password must be at least 8 characters' })
      setLoading(false)
      return
    }

    if (fundPassword !== confirmFundPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      await authService.updateFundPassword(currentFundPassword, fundPassword)
      setMessage({ type: 'success', text: 'Fund password updated successfully' })
      setCurrentFundPassword('')
      setFundPassword('')
      setConfirmFundPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update fund password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your account settings, security, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-gray-700">
          {[
            { id: 'dashboard' as TabType, label: 'Dashboard', icon: ArrowUpRightSquare },
            { id: 'identity' as TabType, label: 'Identity Verification', icon: User },
            { id: 'history' as TabType, label: 'Spot History', icon: Clock },
            { id: 'security' as TabType, label: 'Security', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-white bg-red-500/10'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Deposits</span>
                  <ArrowDownLeft className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">${stats.totalDeposits.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Withdrawals</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">${stats.totalWithdrawals.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Trading Volume</span>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">${stats.tradingVolume.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">ROI</span>
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">+{stats.roi.toFixed(2)}%</p>
              </div>
            </div>

            {/* Performance and Security Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Performance */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Portfolio Performance
                  </h3>
                </div>
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Total P&L</p>
                  <p className="text-3xl font-bold text-yellow-400">${stats.totalPnL.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm mt-1">{stats.trades} trades • {stats.wins} wins</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">24h</p>
                    <p className="text-green-400 text-sm">↑ $0.00</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">7d</p>
                    <p className="text-green-400 text-sm">↑ $0.00</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">30d</p>
                    <p className="text-green-400 text-sm">↑ $0.00</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">Win Rate</span>
                    <span className="text-white text-sm">{stats.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${stats.winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Security Status */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Status
                  </h3>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Security Score</span>
                    <span className="text-white text-sm">25%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-white text-sm">Email Verified</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-400 text-sm">Identity Verified</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-400 text-sm">2FA Enabled</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Last login: {stats.lastLogin}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity and Market */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white flex items-center mb-4">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </h3>
                <p className="text-gray-400">No recent activity.</p>
              </div>

              {/* Market Overview */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Market Overview
                  </h3>
                  <button className="text-orange-500 text-sm hover:text-orange-400">View All</button>
                </div>
                <p className="text-gray-400 text-sm mb-3">Top Gainers</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white">CREAM/USDT</span>
                    <span className="text-green-400">↑ 65.35%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Sub-tabs */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveSecurityTab('login')}
                className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors ${
                  activeSecurityTab === 'login'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Login Password</span>
              </button>
              <button
                onClick={() => setActiveSecurityTab('funds')}
                className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors ${
                  activeSecurityTab === 'funds'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Funds Password</span>
              </button>
            </div>

            {message && (
              <div
                className={`p-4 rounded-xl ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                    : 'bg-red-500/10 border border-red-500/50 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Login Password Section */}
            {activeSecurityTab === 'login' && (
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Change Password</h2>
                  <p className="text-gray-400">Secure your account by updating your password</p>
                </div>

                <form onSubmit={handleUpdateLoginPassword} className="max-w-md mx-auto space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Current Login Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      New Login Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                        placeholder="Enter new password (8+ characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Confirm Login Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Funds Password Section */}
            {activeSecurityTab === 'funds' && (
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50">
                {!user?.isFundPasswordSet ? (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-2">Set Fund Password</h2>
                      <p className="text-gray-400">Create a fund password for withdrawals and transactions</p>
                    </div>

                    <form onSubmit={handleSetFundPassword} className="max-w-md mx-auto space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Fund Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showFundPassword ? 'text' : 'password'}
                            value={fundPassword}
                            onChange={(e) => setFundPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                            placeholder="Enter fund password (min 8 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFundPassword(!showFundPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Confirm Fund Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmFundPassword ? 'text' : 'password'}
                            value={confirmFundPassword}
                            onChange={(e) => setConfirmFundPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                            placeholder="Confirm fund password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmFundPassword(!showConfirmFundPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {loading ? 'Setting...' : 'Set Password'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-2">Change Fund Password</h2>
                      <p className="text-gray-400">Update your fund password for withdrawals and transactions</p>
                    </div>

                    <form onSubmit={handleUpdateFundPassword} className="max-w-md mx-auto space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Current Fund Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentFundPassword ? 'text' : 'password'}
                            value={currentFundPassword}
                            onChange={(e) => setCurrentFundPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                            placeholder="Enter current fund password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentFundPassword(!showCurrentFundPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showCurrentFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          New Fund Password
                        </label>
                        <div className="relative">
                          <input
                            type={showFundPassword ? 'text' : 'password'}
                            value={fundPassword}
                            onChange={(e) => setFundPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                            placeholder="Enter new fund password (min 8 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFundPassword(!showFundPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Confirm New Fund Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmFundPassword ? 'text' : 'password'}
                            value={confirmFundPassword}
                            onChange={(e) => setConfirmFundPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                            placeholder="Confirm new fund password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmFundPassword(!showConfirmFundPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {loading ? 'Updating...' : 'Update Fund Password'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Identity Verification Tab - Placeholder */}
        {activeTab === 'identity' && (
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 text-center">
            <p className="text-gray-400">Identity Verification feature coming soon...</p>
          </div>
        )}

        {/* Spot History Tab - Placeholder */}
        {activeTab === 'history' && (
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 text-center">
            <p className="text-gray-400">Spot History feature coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

