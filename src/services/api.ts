import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Remove any extra quotes or whitespace that might cause JWT malformed errors
      const cleanToken = token.trim().replace(/^["']|["']$/g, '')
      if (cleanToken) {
        config.headers.Authorization = `Bearer ${cleanToken}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          // Clean the refresh token as well
          const cleanRefreshToken = refreshToken.trim().replace(/^["']|["']$/g, '')
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: cleanRefreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken)
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`

          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.data?.code === 'MAINTENANCE_MODE') {
      // Don't redirect if we're already on a public page or if user is an admin
      const publicPaths = ['/', '/login', '/register', '/maintenance']
      const isPublicPath = publicPaths.includes(window.location.pathname)

      const storedUser = localStorage.getItem('user')
      let isAdmin = false
      try {
        if (storedUser) {
          const user = JSON.parse(storedUser)
          const role = user.role?.toLowerCase()
          isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin'
        }
      } catch (e) { }

      if (!isPublicPath && !isAdmin) {
        window.location.href = '/maintenance'
      }
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api

