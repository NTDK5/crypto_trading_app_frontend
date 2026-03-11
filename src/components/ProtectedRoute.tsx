import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

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

  // NOTE: We no longer block the entire app for non-KYC users.
  // Backend enforces KYC for restricted actions (trade/deposit/withdraw).

  return <>{children}</>
}
