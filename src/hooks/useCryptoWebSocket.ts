import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import { binanceService } from '../services/binanceService'
import { marketService } from '../services/marketService'

interface CryptoData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  high_24h: number
  low_24h: number
  total_volume: number
  market_cap_rank?: number
}

interface UseCryptoWebSocketOptions {
  initialData?: CryptoData[]
  useWebSocket?: boolean
  pollInterval?: number // Polling interval in milliseconds
}

export function useCryptoWebSocket(options: UseCryptoWebSocketOptions = {}) {
  const { initialData = [], useWebSocket = true, pollInterval = 2000 } = options
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(initialData)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  // Map Binance ticker data to our format
  const mapBinanceData = (binanceData: any[]): CryptoData[] => {
    return binanceData
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .map((ticker: any) => {
        const symbol = ticker.symbol.replace('USDT', '').toLowerCase()
        return {
          id: symbol,
          symbol: symbol.toUpperCase(),
          name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
          current_price: parseFloat(ticker.lastPrice ?? ticker.price) || 0,
          price_change_percentage_24h: parseFloat(ticker.priceChangePercent) || 0,
          high_24h: parseFloat(ticker.highPrice) || 0,
          low_24h: parseFloat(ticker.lowPrice) || 0,
          total_volume: parseFloat(ticker.quoteVolume) || 0,
          market_cap_rank: undefined,
        }
      })
      .filter((crypto: CryptoData) => crypto.current_price > 0)
      .sort((a: CryptoData, b: CryptoData) => b.total_volume - a.total_volume)
  }

  // Fetch data with multi-tier fallback resilient to Binance issues
  const fetchMarketData = async () => {
    try {
      let binanceData: any[] = []
      try {
        // 1. Try direct Binance call
        binanceData = await binanceService.getAllTickers()
      } catch (err) {
        console.warn('Binance direct fetch failed, falling back to backend api /market/tickers/24hr', err)
        try {
          // 2. Try backend raw endpoint
          const r = await api.get<{ success: boolean; data: any[] }>('/market/tickers/24hr')
          binanceData = r.data.data || []
        } catch (backendErr) {
          console.warn('Backend /market/tickers/24hr failed, falling back to marketService.getAllMarketData()', backendErr)
          // 3. Ultimate fallback to backend stored/mocked generic data
          const fallbackData = await marketService.getAllMarketData()
          binanceData = fallbackData.map(md => ({
            symbol: `${md.asset}USDT`,
            price: String(md.price),
            lastPrice: String(md.price),
            priceChangePercent: String(md.change24h),
            highPrice: String(md.high24h),
            lowPrice: String(md.low24h),
            quoteVolume: String(md.volume24h),
            volume: '0'
          }))
        }
      }

      const mappedData = mapBinanceData(binanceData)
      
      if (isMountedRef.current) {
        setCryptoData(mappedData)
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error)
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Initial fetch and continuous polling
  useEffect(() => {
    isMountedRef.current = true
    
    // Initial fetch
    fetchMarketData()

    // Set up continuous polling (like WebSocket)
    if (useWebSocket) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchMarketData()
        }
      }, pollInterval)
    }

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [useWebSocket, pollInterval])

  return { cryptoData, loading, setCryptoData }
}

