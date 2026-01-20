import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Check both state and localStorage as fallback
  const token = localStorage.getItem('accessToken')
  const authenticated = isAuthenticated || !!token

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

