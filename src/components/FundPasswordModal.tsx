import { useState } from 'react'
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

interface FundPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function FundPasswordModal({ isOpen, onClose, onSuccess }: FundPasswordModalProps) {
  const [fundPassword, setFundPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshUser } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (fundPassword.length < 8) {
      setError('Fund password must be at least 8 characters')
      return
    }

    if (fundPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await authService.setFundPassword(fundPassword)
      await refreshUser()
      setFundPassword('')
      setConfirmPassword('')
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set fund password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start mb-6">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white mb-1">Set Fund Password</h2>
            <p className="text-gray-400 text-sm">Required for withdrawals and transactions</p>
          </div>
        </div>

        {/* Important Message */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/50">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold mb-1">Important:</p>
              <p className="text-gray-400 text-sm">
                You must set a fund password to make withdrawals and perform transactions. This password is different from your login password.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fundPassword" className="block text-sm font-medium text-white mb-2">
              Fund Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="fundPassword"
                type={showPassword ? 'text' : 'password'}
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                placeholder="Enter fund password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm Fund Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                placeholder="Confirm fund password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800/50 hover:bg-gray-800/80 text-white rounded-xl transition-all border border-gray-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-orange-500/30 flex items-center justify-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? 'Setting...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

