import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        // Fetch maintenance status from public config endpoint
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin" />
      </div>
    )
  }

  // Check both state and localStorage as fallback
  const token = localStorage.getItem('accessToken')
  const authenticated = isAuthenticated || !!token

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  // Handle Maintenance Mode redirection
  const role = user?.role?.toLowerCase()
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin'
  if (isMaintenance && !isAdmin && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />
  }

  return <>{children}</>
}

