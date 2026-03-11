// Market data service (backend-mediated).
// IMPORTANT: Frontend must not call Binance directly.

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
  bids: Array<[string, string]>
  asks: Array<[string, string]>
}

export interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

import api from './api'

// ─── REST helpers ───────────────────────────────────────────────────────────

export const binanceService = {
  /** 24 hr ticker for one symbol */
  async getTicker(symbol: string): Promise<BinanceTicker> {
    const r = await api.get<{ success: boolean; data: any }>(`/market/${symbol}/ticker`)
    const d = r.data.data
    return {
      symbol: d.symbol,
      price: String(d.price ?? d.lastPrice ?? '0'),
      priceChangePercent: String(d.priceChangePercent ?? '0'),
      highPrice: String(d.highPrice ?? '0'),
      lowPrice: String(d.lowPrice ?? '0'),
      volume: String(d.volume ?? '0'),
      quoteVolume: String(d.quoteVolume ?? '0'),
    }
  },

  /** All USDT-quoted tickers, sorted by quote volume (descending) */
  async getAllTickers(): Promise<BinanceTicker[]> {
    const r = await api.get<{ success: boolean; data: any[] }>('/market/tickers/24hr')
    const data = r.data.data || []
    return (data as any[])
      .filter(t => String(t.symbol || '').endsWith('USDT'))
      .map(t => ({
        symbol: t.symbol,
        price: String(t.lastPrice ?? t.price ?? '0'),
        priceChangePercent: String(t.priceChangePercent ?? '0'),
        highPrice: String(t.highPrice ?? '0'),
        lowPrice: String(t.lowPrice ?? '0'),
        volume: String(t.volume ?? '0'),
        quoteVolume: String(t.quoteVolume ?? '0'),
      }))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
  },

  /** Historical kline data */
  async getCandlesticks(symbol: string, interval = '1m', limit = 500): Promise<CandlestickData[]> {
    const r = await api.get<{ success: boolean; data: any[][] }>(`/market/${symbol}/klines`, {
      params: { interval, limit },
    })
    const data = r.data.data || []
    return (data as any[][]).map(k => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  },

  /** Order book snapshot */
  async getOrderBook(symbol: string, limit = 20): Promise<BinanceOrderBook> {
    const r = await api.get<{ success: boolean; data: BinanceOrderBook }>(`/market/${symbol}/depth`, {
      params: { limit },
    })
    return r.data.data
  },
}

// ─── Realtime-ish helpers (polling, no Binance WS in frontend) ───────────────

type BookCallback = (book: BinanceOrderBook) => void
type KlineCallback = (candle: CandlestickData, isFinal: boolean) => void

interface WSHandle {
  close: () => void
}

/**
 * Subscribe to the combined mini-ticker stream for several symbols.
 * Returns a handle with a .close() method.
 *
 * @param symbols e.g. ['BTCUSDT', 'ETHUSDT']
 * @param onTicker called on every price update
 */
export function subscribeMiniTickers(
  symbols: string[],
  onTicker: (symbol: string, price: number, changePct: number) => void,
): WSHandle {
  let closed = false
  const poll = async () => {
    try {
      const tickers = await binanceService.getAllTickers()
      if (closed) return
      const wanted = new Set(symbols.map(s => s.toUpperCase()))
      tickers
        .filter(t => wanted.has(t.symbol.toUpperCase()))
        .forEach(t => onTicker(t.symbol, parseFloat(t.price), parseFloat(t.priceChangePercent || '0')))
    } catch { /* ignore */ }
  }
  poll()
  const id = setInterval(poll, 1500)
  return {
    close: () => {
      closed = true
      clearInterval(id)
    },
  }
}

/**
 * Subscribe to the 24 hr ticker stream for ONE symbol.
 * Fires onTicker with a full BinanceTicker object.
 */
export function subscribeTicker(
  symbol: string,
  onTicker: (t: BinanceTicker) => void,
): WSHandle {
  let closed = false
  const poll = async () => {
    try {
      const t = await binanceService.getTicker(symbol)
      if (!closed) onTicker(t)
    } catch { /* ignore */ }
  }
  poll()
  const id = setInterval(poll, 1000)
  return {
    close: () => {
      closed = true
      clearInterval(id)
    },
  }
}

/**
 * Subscribe to the order book diff stream for ONE symbol.
 * Returns a simplified book on every depth update.
 */
export function subscribeOrderBook(
  symbol: string,
  onBook: BookCallback,
  depth = 10,
): WSHandle {
  let closed = false
  const poll = async () => {
    try {
      const book = await binanceService.getOrderBook(symbol, depth)
      if (!closed) onBook(book)
    } catch { /* ignore */ }
  }
  poll()
  const id = setInterval(poll, 1000)
  return {
    close: () => {
      closed = true
      clearInterval(id)
    },
  }
}

/**
 * Subscribe to the kline/candlestick stream for ONE symbol.
 * onCandle is called with the current (possibly unclosed) candle and
 * isFinal=true when the candle closes.
 */
export function subscribeKline(
  symbol: string,
  interval: string,
  onCandle: KlineCallback,
): WSHandle {
  let closed = false
  let lastLen = 0
  const poll = async () => {
    try {
      const candles = await binanceService.getCandlesticks(symbol, interval, 500)
      if (closed) return
      if (candles.length === 0) return
      const isFinal = candles.length !== lastLen
      lastLen = candles.length
      onCandle(candles[candles.length - 1], isFinal)
    } catch { /* ignore */ }
  }
  poll()
  const id = setInterval(poll, 2500)
  return {
    close: () => {
      closed = true
      clearInterval(id)
    },
  }
}
