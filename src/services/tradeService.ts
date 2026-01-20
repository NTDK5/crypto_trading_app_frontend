import api from './api'

export interface Trade {
  id: string
  asset: string
  direction: 'UP' | 'DOWN'
  amount: number
  entryPrice: number
  exitPrice?: number
  expiryTime: string
  status: 'PENDING' | 'OPEN' | 'EXPIRED' | 'WON' | 'LOST' | 'CANCELLED'
  profit?: number
  createdAt: string
}

export interface CreateTradeData {
  asset: string
  direction: 'UP' | 'DOWN'
  amount: number
  duration?: number
}

export const tradeService = {
  async createTrade(data: CreateTradeData): Promise<Trade> {
    const response = await api.post<Trade>('/trades', data)
    return response.data
  },

  async getUserTrades(): Promise<Trade[]> {
    const response = await api.get<Trade[]>('/trades')
    return response.data
  },

  async getTradeById(tradeId: string): Promise<Trade> {
    const response = await api.get<Trade>(`/trades/${tradeId}`)
    return response.data
  },
}

