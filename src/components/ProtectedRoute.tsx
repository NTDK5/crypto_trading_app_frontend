import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import api from '../services/api'
import { AlertCircle, Clock, UploadCloud } from 'lucide-react'

function KycVerificationFlow({ status, reason }: { status: 'UNVERIFIED' | 'PENDING' | 'REJECTED'; reason?: string | null }) {
  const { logout, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    idType: 'passport',
    idNumber: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.submitKyc(formData)
      await refreshUser() // Refresh user context globally
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit KYC data.')
    } finally {
      setLoading(false)
    }
  }

  // Render pending state
  if (status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-950 flex shadow-2xl items-center justify-center p-4">
        <div className="max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-3">Verification Pending</h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            Your verification documents are currently under review by our compliance team. Once approved, you'll be able to access trading features.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 text-left">
            <p className="text-amber-400 font-semibold text-sm mb-2">⏳ What happens next?</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Admin reviews your application</li>
              <li>Usually resolved within 24–48 hours</li>
              <li>Automatic access granted once approved</li>
            </ul>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center p-4">
      {/* Brand logo */}
      <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight mb-8">
        CryptoXD
      </div>

      <div className="w-full max-w-lg bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl z-10 relative">
        <div className="flex items-center gap-3 mb-2">
          {status === 'REJECTED' ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : (
            <UploadCloud className="w-6 h-6 text-cyan-400" />
          )}
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {status === 'REJECTED' ? 'Verification Rejected' : 'Complete Verification'}
          </h2>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          {status === 'REJECTED'
            ? 'Your previous submission was declined. Please review the reason and re-submit your true identity information.'
            : 'To comply with financial regulations and protect your account, please complete your identity verification (KYC).'}
        </p>

        {status === 'REJECTED' && reason && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Reason for Rejection:</p>
              <p className="opacity-90 leading-relaxed">{reason}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Full Legal Name
            </label>
            <input
              required
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Date of Birth
              </label>
              <input
                required
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Document Type
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none"
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="driver_license">Driver's License</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Document / ID Number
            </label>
            <input
              required
              name="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="e.g. A12345678"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Verification'
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full mt-2 py-3 text-sm text-gray-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await api.get('/admin/config/MAINTENANCE_MODE_ENABLED')
        if (response.data.success && response.data.data.value === 'true') {
          setIsMaintenance(true)
        }
      } catch (error) {
        console.error('Failed to check maintenance status', error)
      } finally {
        setCheckingMaintenance(false)
      }
    }

    checkMaintenance()
  }, [])

  if (loading || checkingMaintenance) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="h-10 w-10 rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin" />
      </div>
    )
  }

  const token = localStorage.getItem('accessToken')
  const authenticated = isAuthenticated || !!token

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  // Maintenance mode – admins bypass
  const role = user?.role?.toLowerCase()
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin'
  if (isMaintenance && !isAdmin && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />
  }

  // KYC check – admins bypass.
  // Standard users MUST be verified to access anything under /app
  if (!isAdmin && user && user.kycStatus !== 'APPROVED') {
    return <KycVerificationFlow status={user.kycStatus as any} reason={user.kycRejectedReason} />
  }

  return <>{children}</>
}
