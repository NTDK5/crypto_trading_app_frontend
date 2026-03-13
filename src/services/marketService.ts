import api from './api'
import { binanceService } from './binanceService'

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
    try {
      // 1. Try fetching directly from Binance first (bypassing backend Redis issues)
      const tickers = await binanceService.getAllTickers()
      
      const normalized = tickers
        .filter(t => BINANCE_SYMBOLS.includes(t.symbol.toUpperCase()))
        .map(t => ({
          asset: t.symbol.toUpperCase().replace('USDT', ''),
          price: parseFloat(t.price),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.volume),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
        }))

      if (normalized.length > 0) return normalized
      throw new Error('No symbols matched from Binance')
    } catch (err) {
      console.warn("Binance direct fetch failed, falling back to backend...", err)
      // 2. Fallback to backend API
      const response = await api.get<{ success: boolean; data: any[] }>('/market')
      const rows = response.data.data || []
      return rows
        .map(r => ({
          asset: String(r.asset).replace('USDT', ''),
          price: Number(r.price) || 0,
          change24h: Number(r.change24h) || 0,
          volume24h: Number(r.volume24h) || 0,
          high24h: Number(r.high24h) || 0,
          low24h: Number(r.low24h) || 0,
        }))
        .filter(r => BINANCE_SYMBOLS.includes(`${r.asset}USDT`))
    }
  },

  async getPrice(asset: string): Promise<number> {
    try {
      const ticker = await binanceService.getTicker(`${asset}USDT`)
      return parseFloat(ticker.price)
    } catch {
      const response = await api.get<{ success: boolean; data: { price: number } }>(`/market/${asset}/price`)
      return response.data.data.price
    }
  },

  async getMarketData(asset: string): Promise<MarketData> {
    try {
      const ticker = await binanceService.getTicker(`${asset}USDT`)
      return {
        asset: asset.replace('USDT', ''),
        price: parseFloat(ticker.price),
        change24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.volume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
      }
    } catch {
      const response = await api.get<{ success: boolean; data: MarketData }>(`/market/${asset}/data`)
      return response.data.data
    }
  },
}

