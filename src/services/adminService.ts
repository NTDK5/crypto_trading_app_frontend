import api from './api'

export interface AdminStats {
    totalUsers: number
    activeUsers: number
    totalVolume: number
    pendingDeposits: number
    pendingWithdrawals: number
}

export interface AdminUser {
    id: string
    email: string
    name: string
    role: string
    isEmailVerified: boolean
    kycStatus: string
    tradingFrozen: boolean
    withdrawalsFrozen: boolean
    createdAt: string
    wallet?: {
        totalBalance: number
        asset: string
    }
}

export interface AdminTransaction {
    id: string
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE' | 'TRANSFER'
    amount: number
    asset: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
    txHash?: string
    address?: string
    userId: string
    user?: {
        email: string
    }
    createdAt: string
}

export const adminService = {
    // Dashboard
    async getDashboardStats(): Promise<AdminStats> {
        const response = await api.get<{ success: boolean; data: AdminStats }>('/admin/dashboard')
        return response.data.data
    },

    // Users
    async getUsers(page = 1, limit = 10, search = ''): Promise<{ users: AdminUser[]; pagination: any }> {
        const response = await api.get<{ success: boolean; data: AdminUser[]; pagination: any }>(
            '/admin/users',
            { params: { page, limit, search } }
        )
        return { users: response.data.data, pagination: response.data.pagination }
    },

    async getUserDetails(id: string): Promise<AdminUser> {
        const response = await api.get<{ success: boolean; data: AdminUser }>(`/admin/users/${id}`)
        return response.data.data
    },

    async freezeUserTrading(id: string, reason: string): Promise<void> {
        await api.post(`/admin/users/${id}/freeze-trading`, { reason })
    },

    async unfreezeUserTrading(id: string): Promise<void> {
        await api.post(`/admin/users/${id}/unfreeze-trading`)
    },

    // Transactions
    async getPendingDeposits(): Promise<AdminTransaction[]> {
        const response = await api.get<{ success: boolean; data: AdminTransaction[] }>('/admin/deposits/pending')
        return response.data.data
    },

    async approveDeposit(id: string, notes?: string): Promise<void> {
        await api.post(`/admin/deposits/${id}/approve`, { notes })
    },

    async rejectDeposit(id: string, reason: string): Promise<void> {
        await api.post(`/admin/deposits/${id}/reject`, { reason })
    },

    async getPendingWithdrawals(): Promise<AdminTransaction[]> {
        const response = await api.get<{ success: boolean; data: AdminTransaction[] }>('/admin/withdrawals/pending')
        return response.data.data
    },

    // Note: These endpoints might need to be implemented on backend
    async approveWithdrawal(id: string, txHash?: string): Promise<void> {
        await api.post(`/admin/withdrawals/${id}/approve`, { txHash })
    },

    async rejectWithdrawal(id: string, reason: string): Promise<void> {
        await api.post(`/admin/withdrawals/${id}/reject`, { reason })
    },

    // Config
    async getSystemConfig(): Promise<any> {
        const response = await api.get('/admin/config')
        return response.data.data
    },

    async updateSystemConfig(key: string, value: any): Promise<void> {
        await api.put('/admin/config', { key, value })
    },

    async pauseTrading(): Promise<void> {
        await api.post('/admin/trading/pause')
    },

    async resumeTrading(): Promise<void> {
        await api.post('/admin/trading/resume')
    }
}
