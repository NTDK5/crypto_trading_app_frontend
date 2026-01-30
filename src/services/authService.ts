import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
    isFundPasswordSet?: boolean
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials)
    return response.data.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data)
    return response.data.data
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
      refreshToken,
    })
    return response.data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/google', { idToken })
    return response.data.data
  },

  async getUserProfile(): Promise<AuthResponse['user']> {
    const response = await api.get<{ success: boolean; data: AuthResponse['user'] }>('/auth/profile')
    return response.data.data
  },

  async setFundPassword(fundPassword: string): Promise<{ isFundPasswordSet: boolean }> {
    const response = await api.post<{ success: boolean; data: { isFundPasswordSet: boolean } }>('/auth/fund-password/set', {
      fundPassword,
    })
    return response.data.data
  },

  async updateFundPassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/fund-password/update', {
      currentPassword,
      newPassword,
    })
  },

  async verifyFundPassword(fundPassword: string): Promise<{ verified: boolean }> {
    const response = await api.post<{ success: boolean; data: { verified: boolean } }>('/auth/fund-password/verify', {
      fundPassword,
    })
    return response.data.data
  },
}

