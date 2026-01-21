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
    const response = await api.get<{ success: boolean; data: MarketData[] }>('/market')
    return response.data.data || []
  },

  async getPrice(asset: string): Promise<number> {
    const response = await api.get<{ success: boolean; data: { price: number } }>(`/market/${asset}/price`)
    return response.data.data.price
  },

  async getMarketData(asset: string): Promise<MarketData> {
    const response = await api.get<{ success: boolean; data: MarketData }>(`/market/${asset}/data`)
    return response.data.data
  },
}

