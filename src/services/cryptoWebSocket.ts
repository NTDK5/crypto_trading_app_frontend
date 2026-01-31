interface PriceUpdate {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high24h: number
  low24h: number
  volume24h: number
}

type PriceUpdateCallback = (updates: Map<string, PriceUpdate>) => void

class CryptoWebSocketService {
  private ws: WebSocket | null = null
  private subscribers: Set<PriceUpdateCallback> = new Set()
  private priceData: Map<string, PriceUpdate> = new Map()
  private symbols: string[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  // Map CoinGecko IDs to Binance symbols
  private symbolMap: Record<string, string> = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'ripple': 'XRPUSDT',
    'binancecoin': 'BNBUSDT',
    'cardano': 'ADAUSDT',
    'solana': 'SOLUSDT',
    'polkadot': 'DOTUSDT',
    'dogecoin': 'DOGEUSDT',
    'matic-network': 'MATICUSDT',
    'litecoin': 'LTCUSDT',
    'chainlink': 'LINKUSDT',
    'bitcoin-cash': 'BCHUSDT',
    'stellar': 'XLMUSDT',
    'ethereum-classic': 'ETCUSDT',
    'vechain': 'VETUSDT',
    'filecoin': 'FILUSDT',
    'tron': 'TRXUSDT',
    'eos': 'EOSUSDT',
    'monero': 'XMRUSDT',
    'tezos': 'XTZUSDT',
    'dash': 'DASHUSDT',
    'zcash': 'ZECUSDT',
    'waves': 'WAVESUSDT',
    'ontology': 'ONTUSDT',
    'zilliqa': 'ZILUSDT',
    'nuls': 'NULSUSDT',
    'mithril': 'MITHUSDT',
    'celer-network': 'CELRUSDT',
    'enjincoin': 'ENJUSDT',
    'usd-coin': 'USDCUSDT',
  }

  // Reverse map: Binance symbol -> CoinGecko ID
  private reverseSymbolMap: Record<string, string> = {}
  
  constructor() {
    // Build reverse map
    Object.entries(this.symbolMap).forEach(([id, symbol]) => {
      this.reverseSymbolMap[symbol.toLowerCase()] = id
    })
  }

  connect(symbols: string[]) {
    this.symbols = symbols
    this.disconnect()

    // Convert CoinGecko symbols to Binance symbols
    const binanceSymbols = symbols
      .map((symbol) => this.symbolMap[symbol.toLowerCase()])
      .filter((s) => s !== undefined)

    if (binanceSymbols.length === 0) {
      console.warn('No valid symbols to subscribe to')
      return
    }

    // Create stream names (lowercase for Binance)
    const streams = binanceSymbols.map((s) => `${s.toLowerCase()}@ticker`).join('/')
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          // Binance stream format: { stream: "btcusdt@ticker", data: {...} }
          if (message.stream && message.data) {
            this.handlePriceUpdate(message.data)
          } else if (message.s) {
            // Direct ticker data
            this.handlePriceUpdate(message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.ws = null
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.attemptReconnect()
    }
  }

  private handlePriceUpdate(data: any) {
    if (!data.s) return // Invalid data format

    // Extract symbol (e.g., "BTCUSDT" -> "btc")
    const fullSymbol = data.s
    const symbol = fullSymbol.replace('USDT', '').toLowerCase()
    const coinGeckoId = this.reverseSymbolMap[fullSymbol.toLowerCase()] || symbol
    
    const price = parseFloat(data.c) || 0 // Current price
    const openPrice = parseFloat(data.o) || price // Open price (24h ago)
    const priceChange = price - openPrice
    const priceChangePercent = openPrice > 0 ? ((priceChange / openPrice) * 100) : 0
    const high24h = parseFloat(data.h) || price // 24h high
    const low24h = parseFloat(data.l) || price // 24h low
    const volume24h = (parseFloat(data.v) || 0) * price // 24h volume in USD

    const update: PriceUpdate = {
      symbol,
      price,
      priceChange,
      priceChangePercent,
      high24h,
      low24h,
      volume24h,
    }

    // Store updates with multiple keys for easy lookup
    this.priceData.set(symbol, update)
    this.priceData.set(fullSymbol.toLowerCase(), update) // With USDT
    this.priceData.set(coinGeckoId, update) // CoinGecko ID
    this.notifySubscribers()
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(new Map(this.priceData))
      } catch (error) {
        console.error('Error in subscriber callback:', error)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.symbols)
    }, this.reconnectDelay)
  }

  subscribe(callback: PriceUpdateCallback) {
    this.subscribers.add(callback)
    // Immediately notify with current data
    callback(new Map(this.priceData))
  }

  unsubscribe(callback: PriceUpdateCallback) {
    this.subscribers.delete(callback)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  getPriceData() {
    return new Map(this.priceData)
  }
}

// Singleton instance
export const cryptoWebSocket = new CryptoWebSocketService()

// Helper function to get CoinGecko ID from symbol
export function getCoinGeckoId(symbol: string): string {
  const idMap: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'xrp': 'ripple',
    'bnb': 'binancecoin',
    'ada': 'cardano',
    'sol': 'solana',
    'dot': 'polkadot',
    'doge': 'dogecoin',
    'matic': 'matic-network',
    'ltc': 'litecoin',
    'link': 'chainlink',
    'bch': 'bitcoin-cash',
    'xlm': 'stellar',
    'etc': 'ethereum-classic',
    'vet': 'vechain',
    'fil': 'filecoin',
    'trx': 'tron',
    'eos': 'eos',
    'xmr': 'monero',
    'xtz': 'tezos',
    'dash': 'dash',
    'zec': 'zcash',
    'waves': 'waves',
    'ont': 'ontology',
    'zil': 'zilliqa',
    'nuls': 'nuls',
    'mith': 'mithril',
    'celr': 'celer-network',
    'enj': 'enjincoin',
    'usdc': 'usd-coin',
  }
  return idMap[symbol.toLowerCase()] || symbol.toLowerCase()
}

