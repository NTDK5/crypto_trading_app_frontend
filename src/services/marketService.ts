import api from './api'

export interface MarketData {
  asset: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

// Asset symbols to fetch from Binance
const BINANCE_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'AVAXUSDT',
]

export const marketService = {
  async getAllMarketData(): Promise<MarketData[]> {
    const response = await api.get<{ success: boolean; data: any[] }>('/market')
    const rows = response.data.data || []
    // Backend currently returns assets like BTCUSDT (enum), normalize to UI asset codes.
    const normalized = rows
      .filter(r => r && r.asset)
      .map(r => ({
        asset: String(r.asset).replace('USDT', ''),
        price: Number(r.price) || 0,
        change24h: Number(r.change24h) || 0,
        volume24h: Number(r.volume24h) || 0,
        high24h: Number(r.high24h) || 0,
        low24h: Number(r.low24h) || 0,
      }))

    // Keep symbol list stable (UI expects these)
    return normalized.filter(r => BINANCE_SYMBOLS.includes(`${r.asset}USDT`))
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

