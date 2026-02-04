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
    try {
      console.log('Fetching market data directly from Binance...')

      // Fetch all market data in parallel from Binance
      const promises = BINANCE_SYMBOLS.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}`)
          }

          const data = await response.json()

          return {
            asset: symbol,
            price: parseFloat(data.lastPrice),
            change24h: parseFloat(data.priceChangePercent),
            volume24h: parseFloat(data.volume),
            high24h: parseFloat(data.highPrice),
            low24h: parseFloat(data.lowPrice),
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol}:`, error)
          return null
        }
      })

      const results = await Promise.all(promises)
      const validResults = results.filter((r): r is MarketData => r !== null)

      console.log(`Successfully fetched ${validResults.length} market data entries from Binance`)

      // If Binance API fails completely, return mock data
      if (validResults.length === 0) {
        console.warn('Binance API failed, returning mock data')
        return [
          { asset: 'BTCUSDT', price: 43250.50, change24h: 2.45, volume24h: 28500000000, high24h: 43800, low24h: 42100 },
          { asset: 'ETHUSDT', price: 2280.75, change24h: 1.85, volume24h: 12400000000, high24h: 2320, low24h: 2240 },
          { asset: 'BNBUSDT', price: 315.20, change24h: -0.65, volume24h: 890000000, high24h: 320, low24h: 312 },
          { asset: 'SOLUSDT', price: 98.45, change24h: 3.12, volume24h: 2100000000, high24h: 102, low24h: 95 },
          { asset: 'ADAUSDT', price: 0.52, change24h: 1.25, volume24h: 450000000, high24h: 0.54, low24h: 0.51 },
          { asset: 'XRPUSDT', price: 0.58, change24h: -1.15, volume24h: 1200000000, high24h: 0.60, low24h: 0.57 },
          { asset: 'DOGEUSDT', price: 0.085, change24h: 0.95, volume24h: 680000000, high24h: 0.087, low24h: 0.083 },
          { asset: 'DOTUSDT', price: 7.25, change24h: 2.10, volume24h: 320000000, high24h: 7.45, low24h: 7.05 },
        ]
      }

      return validResults
    } catch (error) {
      console.error('Failed to fetch market data from Binance:', error)

      // Return mock data as fallback
      return [
        { asset: 'BTCUSDT', price: 43250.50, change24h: 2.45, volume24h: 28500000000, high24h: 43800, low24h: 42100 },
        { asset: 'ETHUSDT', price: 2280.75, change24h: 1.85, volume24h: 12400000000, high24h: 2320, low24h: 2240 },
        { asset: 'BNBUSDT', price: 315.20, change24h: -0.65, volume24h: 890000000, high24h: 320, low24h: 312 },
        { asset: 'SOLUSDT', price: 98.45, change24h: 3.12, volume24h: 2100000000, high24h: 102, low24h: 95 },
        { asset: 'ADAUSDT', price: 0.52, change24h: 1.25, volume24h: 450000000, high24h: 0.54, low24h: 0.51 },
        { asset: 'XRPUSDT', price: 0.58, change24h: -1.15, volume24h: 1200000000, high24h: 0.60, low24h: 0.57 },
        { asset: 'DOGEUSDT', price: 0.085, change24h: 0.95, volume24h: 680000000, high24h: 0.087, low24h: 0.083 },
        { asset: 'DOTUSDT', price: 7.25, change24h: 2.10, volume24h: 320000000, high24h: 7.45, low24h: 7.05 },
      ]
    }
  },

  async getPrice(asset: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${asset}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${asset}`)
      }

      const data = await response.json()
      return parseFloat(data.price)
    } catch (error) {
      console.error(`Failed to fetch price for ${asset}:`, error)
      // Fallback to backend API
      const response = await api.get<{ success: boolean; data: { price: number } }>(`/market/${asset}/price`)
      return response.data.data.price
    }
  },

  async getMarketData(asset: string): Promise<MarketData> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${asset}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch market data for ${asset}`)
      }

      const data = await response.json()

      return {
        asset,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
      }
    } catch (error) {
      console.error(`Failed to fetch market data for ${asset}:`, error)
      // Fallback to backend API
      const response = await api.get<{ success: boolean; data: MarketData }>(`/market/${asset}/data`)
      return response.data.data
    }
  },
}

