import api from './api'

// ─────────────────────────────────────────── Types ──────────────────────────────────────────

export interface DashboardMetrics {
    totalBalances: Record<string, { balance: number; locked: number; total: number }>
    netExposure: Record<string, number>
    totalFeesEarned: { total: number }
    pendingCounts: { deposits: number; withdrawals: number; trades: number }
    systemStatus: { tradingEnabled: boolean; withdrawalsEnabled: boolean; maintenanceMode: boolean; lastUpdated: string }
    userStats: { total: number; active: number }
}

export interface PlatformStats {
    trades: { count: number; volume: number }
    deposits: { count: number; amount: number }
    withdrawals: { count: number; amount: number }
    users: { newUsers: number }
    fees: { total: number }
    period: { startDate?: string; endDate?: string }
}

export interface SystemHealth {
    failedTransactions24h: number
    failedTrades24h: number
    frozenUsers: number
    exposureLimitsConfigured: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    timestamp: string
}

export interface ActivityItem {
    type: 'TRADE' | 'TRANSACTION' | 'ADMIN_ACTION'
    id: string
    userId?: string
    adminId?: string
    user?: { id: string; email: string; name: string }
    admin?: { id: string; email: string; name: string; adminRole: string }
    details: Record<string, any>
    timestamp: string
}

export interface AdminUser {
    id: string
    email: string
    name: string
    role: string
    adminRole?: string
    isActive: boolean
    isVerified: boolean
    createdAt: string
    wallets: Array<{ asset: string; balance: number; lockedBalance: number }>
    flags?: {
        tradingFrozen: boolean
        withdrawalsFrozen: boolean
        flagReason?: string
        internalNotes?: string
    } | null
    recentTrades?: Array<{ id: string; symbol: string; side: string; amount: number; status: string; createdAt: string }>
    recentTransactions?: Array<{ id: string; type: string; amount: number; status: string; createdAt: string }>
}

export interface AdminTransaction {
    id: string
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'SPOT_BUY' | 'SPOT_SELL' | string
    amount: number
    asset: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
    txHash?: string
    address?: string
    screenshotUrl?: string
    userId: string
    user?: { email: string }
    notes?: string
    createdAt: string
}

export interface SpotTrade {
    id: string
    userId: string
    user?: { id: string; email: string; name: string }
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    price: number
    quoteAmount: number
    fee: number
    status: string
    createdAt: string
}

export interface OrderItem {
    id: string
    userId: string
    user?: { id: string; email: string; name: string }
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    limitPrice?: number
    triggerPrice?: number
    stopPrice?: number
    lockedAmount?: number
    status: string
    createdAt: string
}

export interface TradeSummary {
    spotTrades: Record<string, number>
    pendingOrders: { limitOrders: number; stopOrders: number; stopLimitOrders: number; total: number }
    volume24h: number
    fees24h: number
}

export interface ExposureReport {
    exposures: Array<{ asset: string; netExposure: number; totalBuy: number; totalSell: number }>
}

export interface PlatformBalance {
    asset: string
    totalBalance: number
    totalLocked: number
    available: number
}

export interface AuditLog {
    id: string
    adminId: string
    admin?: { email: string; name: string; adminRole: string }
    actionType: string
    targetType: string
    targetId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    createdAt: string
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

// ─────────────────────────────────────────── Helpers ────────────────────────────────────────
/**
 * Resolves a screenshot URL to a full URL if it's relative.
 */
export const resolveScreenshotUrl = (url?: string): string | undefined => {
    if (!url) return undefined
    if (url.startsWith('http')) return url

    // Fallback to construction based on VITE_API_URL or current host
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    const baseUrl = apiUrl.replace(/\/api$/, '')

    // Ensure relative path starts with /
    const relativePath = url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${relativePath}`
}

// ─────────────────────────────────────────── Service ──────────────────────────────────────────

export const adminService = {
    // ── Dashboard ──────────────────────────────────────────────────────────────
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const r = await api.get<{ success: boolean; data: DashboardMetrics }>('/admin/dashboard')
        return r.data.data
    },

    async getPlatformStats(period?: '24h' | '7d' | '30d'): Promise<PlatformStats> {
        const now = new Date()
        const from = period === '24h'
            ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
            : period === '7d'
                ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const r = await api.get<{ success: boolean; data: PlatformStats }>('/admin/dashboard/stats', {
            params: { startDate: from.toISOString(), endDate: now.toISOString() },
        })
        return r.data.data
    },

    async getRecentActivity(limit = 30): Promise<ActivityItem[]> {
        const r = await api.get<{ success: boolean; data: ActivityItem[] }>('/admin/dashboard/activity', {
            params: { limit },
        })
        return r.data.data
    },

    async getSystemHealth(): Promise<SystemHealth> {
        const r = await api.get<{ success: boolean; data: SystemHealth }>('/admin/dashboard/health')
        return r.data.data
    },

    // ── Users ──────────────────────────────────────────────────────────────────
    async getUsers(opts?: {
        page?: number; limit?: number; search?: string;
        tradingFrozen?: boolean; withdrawalsFrozen?: boolean
    }): Promise<{ users: AdminUser[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminUser[]; pagination: Pagination }>('/admin/users', {
            params: opts,
        })
        return { users: r.data.data, pagination: r.data.pagination }
    },

    async getUserDetail(id: string): Promise<AdminUser> {
        const r = await api.get<{ success: boolean; data: AdminUser }>(`/admin/users/${id}`)
        return r.data.data
    },

    async freezeTrading(id: string, reason: string): Promise<void> {
        await api.post(`/admin/users/${id}/freeze-trading`, { reason })
    },

    async unfreezeTrading(id: string): Promise<void> {
        await api.post(`/admin/users/${id}/unfreeze-trading`)
    },

    async freezeWithdrawals(id: string, reason: string): Promise<void> {
        await api.post(`/admin/users/${id}/freeze-withdrawals`, { reason })
    },

    async unfreezeWithdrawals(id: string): Promise<void> {
        await api.post(`/admin/users/${id}/unfreeze-withdrawals`)
    },

    async suspendUser(id: string, reason: string): Promise<void> {
        await api.post(`/admin/users/${id}/suspend`, { reason })
    },

    async activateUser(id: string): Promise<void> {
        await api.post(`/admin/users/${id}/activate`)
    },

    async resetFundPassword(id: string): Promise<void> {
        await api.delete(`/admin/users/${id}/fund-password`)
    },

    async adjustUserBalance(id: string, asset: string, amount: number, reason: string): Promise<void> {
        await api.post(`/admin/users/${id}/adjust-balance`, { asset, amount, reason })
    },

    async getUserTrades(id: string, params?: { page?: number; limit?: number }): Promise<{ data: SpotTrade[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: SpotTrade[]; pagination: Pagination }>(`/admin/users/${id}/trades`, { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getUserTransactions(id: string, params?: { page?: number; limit?: number; type?: string }): Promise<{ data: AdminTransaction[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[]; pagination: Pagination }>(`/admin/users/${id}/transactions`, { params })
        return {
            data: (r.data.data || []).map(t => ({
                ...t,
                screenshotUrl: resolveScreenshotUrl(t.screenshotUrl)
            })),
            pagination: r.data.pagination
        }
    },

    async addUserNote(id: string, note: string): Promise<void> {
        await api.post(`/admin/users/${id}/notes`, { note })
    },

    // ── Transactions ──────────────────────────────────────────────────────────
    async getPendingDeposits(): Promise<AdminTransaction[]> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[] }>('/admin/deposits/pending')
        return (r.data.data || []).map(t => ({
            ...t,
            screenshotUrl: resolveScreenshotUrl(t.screenshotUrl)
        }))
    },

    async getPendingWithdrawals(): Promise<AdminTransaction[]> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[] }>('/admin/withdrawals/pending')
        return (r.data.data || []).map(t => ({
            ...t,
            screenshotUrl: resolveScreenshotUrl(t.screenshotUrl)
        }))
    },

    async approveDeposit(id: string, notes?: string): Promise<void> {
        await api.post(`/admin/deposits/${id}/approve`, { notes })
    },

    async rejectDeposit(id: string, reason: string): Promise<void> {
        await api.post(`/admin/deposits/${id}/reject`, { reason })
    },

    async approveWithdrawal(id: string, txHash?: string): Promise<void> {
        await api.post(`/admin/withdrawals/${id}/approve`, { txHash })
    },

    async rejectWithdrawal(id: string, reason: string): Promise<void> {
        await api.post(`/admin/withdrawals/${id}/reject`, { reason })
    },

    // ── Trades & Orders ───────────────────────────────────────────────────────
    async getTradeSummary(): Promise<TradeSummary> {
        const r = await api.get<{ success: boolean; data: TradeSummary }>('/admin/trades/summary')
        return r.data.data
    },

    async getSpotTrades(params?: {
        page?: number; limit?: number; userId?: string;
        symbol?: string; side?: string; status?: string; from?: string; to?: string
    }): Promise<{ data: SpotTrade[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: SpotTrade[]; pagination: Pagination }>('/admin/trades/spot', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getLimitOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/admin/trades/limit-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getStopOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/admin/trades/stop-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async getStopLimitOrders(params?: {
        page?: number; limit?: number; userId?: string; symbol?: string; side?: string; status?: string
    }): Promise<{ data: OrderItem[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: OrderItem[]; pagination: Pagination }>('/admin/trades/stop-limit-orders', { params })
        return { data: r.data.data, pagination: r.data.pagination }
    },

    async cancelLimitOrder(id: string): Promise<void> {
        await api.post(`/admin/trades/limit-orders/${id}/cancel`)
    },

    async cancelStopOrder(id: string): Promise<void> {
        await api.post(`/admin/trades/stop-orders/${id}/cancel`)
    },

    // ── Risk ──────────────────────────────────────────────────────────────────
    async getExposure(): Promise<ExposureReport> {
        const r = await api.get<{ success: boolean; data: ExposureReport }>('/admin/risk/exposure')
        return r.data.data
    },

    async getOpenOrdersSummary() {
        const r = await api.get<{ success: boolean; data: any }>('/admin/risk/open-orders')
        return r.data.data
    },

    async getLargeTransactions(threshold = 10000) {
        const r = await api.get<{ success: boolean; data: any }>('/admin/risk/large-transactions', {
            params: { threshold },
        })
        return r.data.data
    },

    async getPlatformBalances(): Promise<PlatformBalance[]> {
        const r = await api.get<{ success: boolean; data: PlatformBalance[] }>('/admin/risk/balances')
        return r.data.data
    },

    // ── Config ────────────────────────────────────────────────────────────────
    async getSystemConfig(category?: string) {
        const r = await api.get<{ success: boolean; data: any[] }>('/admin/config', { params: { category } })
        return r.data.data
    },

    async updateSystemConfig(key: string, value: string, category?: string): Promise<void> {
        await api.put('/admin/config', { key, value, category })
    },

    async pauseTrading(reason: string = 'Admin action'): Promise<void> {
        await api.post('/admin/trading/pause', { reason })
    },

    async resumeTrading(): Promise<void> {
        await api.post('/admin/trading/resume')
    },

    async toggleWithdrawals(enabled: boolean, reason: string = 'Admin action'): Promise<void> {
        await api.post('/admin/config/toggle-withdrawals', { enabled, reason })
    },

    async toggleMaintenance(enabled: boolean, reason: string = 'Admin action'): Promise<void> {
        await api.post('/admin/config/toggle-maintenance', { enabled, reason })
    },

    async updateSpread(symbol: string, spread: number): Promise<void> {
        await api.post('/admin/trading/spread', { symbol, spread })
    },

    async updateFee(fee: number): Promise<void> {
        await api.post('/admin/trading/fee', { fee })
    },

    // ── Audit Logs ────────────────────────────────────────────────────────────
    async getAuditLogs(params?: {
        page?: number; limit?: number;
        adminId?: string; actionType?: string; targetType?: string;
        from?: string; to?: string
    }): Promise<{ data: AuditLog[]; pagination?: Pagination }> {
        // Map from/to → startDate/endDate which the backend expects
        const { from, to, ...rest } = params || {}
        const backendParams: any = { ...rest }
        if (from) backendParams.startDate = from
        if (to) backendParams.endDate = to
        const r = await api.get<{ success: boolean; data: any }>('/admin/audit-logs', { params: backendParams })
        // The service returns { logs: [...], pagination: {...} }
        if (Array.isArray(r.data.data)) {
            return { data: r.data.data }
        }
        return { data: r.data.data?.logs || [], pagination: r.data.data?.pagination }
    },

    async getTransactionHistory(params?: {
        page?: number; limit?: number; type?: string; status?: string; userId?: string
    }): Promise<{ data: AdminTransaction[]; pagination: Pagination }> {
        const r = await api.get<{ success: boolean; data: AdminTransaction[]; pagination: Pagination }>('/admin/transactions/history', { params })
        return {
            data: (r.data.data || []).map(t => ({
                ...t,
                screenshotUrl: resolveScreenshotUrl(t.screenshotUrl)
            })),
            pagination: r.data.pagination
        }
    },
}
