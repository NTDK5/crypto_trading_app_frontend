// Binance API service for real-time market data

export interface BinanceTicker {
  symbol: string
  price: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
}

export interface BinanceCandlestick {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteVolume: string
  trades: number
  takerBuyBaseVolume: string
  takerBuyQuoteVolume: string
}

export interface BinanceOrderBook {
  lastUpdateId: number
  bids: Array<[string, string]> // [price, quantity]
  asks: Array<[string, string]> // [price, quantity]
}

export interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const BINANCE_API_URL = 'https://api.binance.com/api/v3'

export const binanceService = {
  // Get 24hr ticker statistics for a symbol
  async getTicker(symbol: string): Promise<BinanceTicker> {
    const response = await fetch(`${BINANCE_API_URL}/ticker/24hr?symbol=${symbol}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ticker for ${symbol}`)
    }
    const data = await response.json()
    return {
      symbol: data.symbol,
      price: data.lastPrice,
      priceChangePercent: data.priceChangePercent,
      highPrice: data.highPrice,
      lowPrice: data.lowPrice,
      volume: data.volume,
      quoteVolume: data.quoteVolume,
    }
  },

  // Get all USDT pairs ticker data
  async getAllTickers(): Promise<BinanceTicker[]> {
    const response = await fetch(`${BINANCE_API_URL}/ticker/24hr`)
    if (!response.ok) {
      throw new Error('Failed to fetch tickers')
    }
    const data = await response.json()
    return data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .map((ticker: any) => ({
        symbol: ticker.symbol,
        price: ticker.lastPrice,
        priceChangePercent: ticker.priceChangePercent,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        volume: ticker.volume,
        quoteVolume: ticker.quoteVolume,
      }))
      .sort((a: BinanceTicker, b: BinanceTicker) => 
        parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
      )
  },

  // Get candlestick/kline data
  async getCandlesticks(
    symbol: string,
    interval: string = '1m',
    limit: number = 500
  ): Promise<CandlestickData[]> {
    const response = await fetch(
      `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch candlesticks for ${symbol}`)
    }
    const data = await response.json()
    return data.map((kline: any[]) => ({
      time: kline[0] / 1000, // Convert to seconds
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }))
  },

  // Get order book
  async getOrderBook(symbol: string, limit: number = 20): Promise<BinanceOrderBook> {
    const response = await fetch(
      `${BINANCE_API_URL}/depth?symbol=${symbol}&limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch order book for ${symbol}`)
    }
    const data = await response.json()
    return {
      lastUpdateId: data.lastUpdateId,
      bids: data.bids,
      asks: data.asks,
    }
  },
}

