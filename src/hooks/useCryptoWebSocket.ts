import { useEffect, useState, useRef } from 'react'

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
          current_price: parseFloat(ticker.lastPrice) || 0,
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

  // Fetch data from Binance API
  const fetchMarketData = async () => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'accept': 'application/json, text/plain, */*',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const binanceData = await response.json()
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

