import api from './api'

export interface SpotTrade {
    id: string
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    price: number
    quoteAmount: number
    fee: number
    status: 'EXECUTED' | 'PENDING' | 'FAILED'
    executedAt: string
}

export interface PlaceSpotTradeData {
    symbol: string
    side: 'BUY' | 'SELL'
    amount: number // Quote amount (USDT) for BUY, Base quantity for SELL
}

export const spotTradeService = {
    async placeTrade(data: PlaceSpotTradeData): Promise<SpotTrade> {
        const response = await api.post<{ success: boolean; data: SpotTrade }>('/spot/trade', data)
        return response.data.data
    },

    async getTrades(): Promise<SpotTrade[]> {
        const response = await api.get<{ success: boolean; data: SpotTrade[] }>('/spot/trades')
        return response.data.data
    },

    async getPortfolio(): Promise<any> {
        const response = await api.get<{ success: boolean; data: any }>('/spot/portfolio')
        return response.data.data
    },

    async placeStopOrder(data: { symbol: string, side: 'BUY' | 'SELL', quantity: number, triggerPrice: number }): Promise<any> {
        const response = await api.post<{ success: boolean; data: any }>('/spot/stop-order', data)
        return response.data.data
    },

    async cancelStopOrder(id: string): Promise<any> {
        const response = await api.delete<{ success: boolean; message: string }>(`/spot/stop-order/${id}`)
        return response.data
    },

    async getStopOrders(symbol?: string): Promise<any[]> {
        const response = await api.get<{ success: boolean; data: any[] }>('/spot/stop-orders', { params: { symbol } })
        return response.data.data
    },

    async placeLimitOrder(data: { symbol: string, side: 'BUY' | 'SELL', quantity: number, limitPrice: number }): Promise<any> {
        const response = await api.post<{ success: boolean; data: any }>('/spot/limit-order', data)
        return response.data.data
    },

    async cancelLimitOrder(id: string): Promise<any> {
        const response = await api.delete<{ success: boolean; message: string; data: any }>(`/spot/limit-order/${id}`)
        return response.data.data
    },

    async getLimitOrders(symbol?: string): Promise<any[]> {
        const response = await api.get<{ success: boolean; data: any[] }>('/spot/limit-orders', { params: { symbol } })
        return response.data.data
    },

    async placeStopLimitOrder(data: { symbol: string, side: 'BUY' | 'SELL', quantity: number, stopPrice: number, limitPrice: number }): Promise<any> {
        const response = await api.post<{ success: boolean; data: any }>('/spot/stop-limit-order', data)
        return response.data.data
    },

    async cancelStopLimitOrder(id: string): Promise<any> {
        const response = await api.delete<{ success: boolean; message: string; data: any }>(`/spot/stop-limit-order/${id}`)
        return response.data.data
    },

    async getStopLimitOrders(symbol?: string): Promise<any[]> {
        const response = await api.get<{ success: boolean; data: any[] }>('/spot/stop-limit-orders', { params: { symbol } })
        return response.data.data
    },
    
    async getTradingStatus(): Promise<{ enabled: boolean }> {
        const response = await api.get<{ success: boolean; data: { enabled: boolean } }>('/spot/status')
        return response.data.data
    }
}
