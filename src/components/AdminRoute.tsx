import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin" />
            </div>
        )
    }

    // Check if user is authenticated and has SUPER_ADMIN role
    // If not authenticated, let ProtectedRoute handle it (or redirect to login)
    // If authenticated but not admin, redirect to user dashboard
    console.log('AdminRoute check:', user)
    if (!user || (user.role !== 'superadmin' && user.role !== 'SUPER_ADMIN')) {
        console.warn('AdminRoute blocked accessing', user?.role)
        return <Navigate to="/app/dashboard" replace />
    }

    return <>{children}</>
}
