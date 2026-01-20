import api from './api'

export interface MarketData {
  asset: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

export const marketService = {
  async getAllMarketData(): Promise<MarketData[]> {
    const response = await api.get<MarketData[]>('/market')
    return response.data
  },

  async getPrice(asset: string): Promise<number> {
    const response = await api.get<{ price: number }>(`/market/${asset}/price`)
    return response.data.price
  },

  async getMarketData(asset: string): Promise<MarketData> {
    const response = await api.get<MarketData>(`/market/${asset}/data`)
    return response.data
  },
}

