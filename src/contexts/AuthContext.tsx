import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, AuthResponse } from '../services/authService'

interface AuthContextType {
  user: AuthResponse['user'] | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  googleLogin: (idToken: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
    
      if (token) {
        try {
          // Try to fetch fresh user profile
          const userProfile = await authService.getUserProfile()
          setUser(userProfile)
          localStorage.setItem('user', JSON.stringify(userProfile))
        } catch (error) {
          // Fallback to stored user if fetch fails
          const storedUser = localStorage.getItem('user')
          try {
            if (storedUser && storedUser !== "undefined") {
              setUser(JSON.parse(storedUser))
            } else {
              localStorage.removeItem('user')
            }
          } catch (parseError) {
            console.error("Invalid user data in localStorage:", parseError)
            localStorage.removeItem('user')
          }
        }
      }
    
      setLoading(false)
    }

    initAuth()
  }, [])
  

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({ name, email, password })
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const googleLogin = async (idToken: string) => {
    const response = await authService.googleLogin(idToken)
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const refreshUser = async () => {
    try {
      const userProfile = await authService.getUserProfile()
      setUser(userProfile)
      localStorage.setItem('user', JSON.stringify(userProfile))
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

