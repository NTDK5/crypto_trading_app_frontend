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
    this.disconnect()

    // Convert CoinGecko symbols to Binance symbols
    const binanceSymbols = symbols
      .map((symbol) => this.symbolMap[symbol.toLowerCase()])
      .filter((s) => s !== undefined)

    if (binanceSymbols.length === 0) {
      console.warn('No valid symbols to subscribe to')
      return
    }

    // Frontend must not connect to Binance WebSocket.
    // Use polling via backend endpoint; this class keeps the same interface.
    this.startPolling(binanceSymbols)
  }

  private pollTimer: ReturnType<typeof setInterval> | null = null

  private startPolling(binanceSymbols: string[]) {
    // Lazy import to avoid circular deps
    import('./api').then(({ default: api }) => {
      const poll = async () => {
        try {
          const r = await api.get<{ success: boolean; data: any[] }>('/market/tickers/24hr')
          const data = r.data.data || []
          const wanted = new Set(binanceSymbols.map(s => s.toUpperCase()))
          data
            .filter((d: any) => wanted.has(String(d.symbol || '').toUpperCase()))
            .forEach((d: any) => this.handlePriceUpdate(d))
        } catch {
          // ignore; UI will keep last known values
        }
      }
      poll()
      this.pollTimer = setInterval(poll, 1500)
    })
  }

  private handlePriceUpdate(data: any) {
    const symbolField = data?.s || data?.symbol
    if (!symbolField) return // Invalid data format

    // Extract symbol (e.g., "BTCUSDT" -> "btc")
    const fullSymbol = String(symbolField)
    const symbol = fullSymbol.replace('USDT', '').toLowerCase()
    const coinGeckoId = this.reverseSymbolMap[fullSymbol.toLowerCase()] || symbol
    
    // Support both Binance WS shape (c/o/h/l/v) and backend 24hr ticker shape
    const last = data.c ?? data.lastPrice ?? data.price
    const open = data.o ?? data.openPrice
    const high = data.h ?? data.highPrice
    const low = data.l ?? data.lowPrice
    const vol = data.v ?? data.volume
    const quoteVol = data.q ?? data.quoteVolume

    const price = parseFloat(last) || 0 // Current price
    const openPrice = parseFloat(open) || price // Open price (24h ago)
    const priceChange = price - openPrice
    const priceChangePercent = openPrice > 0 ? ((priceChange / openPrice) * 100) : 0
    const high24h = parseFloat(high) || price // 24h high
    const low24h = parseFloat(low) || price // 24h low
    const volume24h = (parseFloat(quoteVol) || (parseFloat(vol) || 0) * price) || 0 // Prefer quote volume

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

  subscribe(callback: PriceUpdateCallback) {
    this.subscribers.add(callback)
    // Immediately notify with current data
    callback(new Map(this.priceData))
  }

  unsubscribe(callback: PriceUpdateCallback) {
    this.subscribers.delete(callback)
  }

  disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
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

