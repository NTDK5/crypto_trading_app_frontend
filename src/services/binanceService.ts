// Binance real-time market data service
// Uses WebSocket streams for live data; REST API for initial + historical data

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

const BINANCE_REST = 'https://api.binance.com/api/v3'
const BINANCE_WS = 'wss://stream.binance.com:9443/ws'

// ─── REST helpers ───────────────────────────────────────────────────────────

export const binanceService = {
  /** 24 hr ticker for one symbol */
  async getTicker(symbol: string): Promise<BinanceTicker> {
    const r = await fetch(`${BINANCE_REST}/ticker/24hr?symbol=${symbol}`)
    if (!r.ok) throw new Error(`Failed to fetch ticker for ${symbol}`)
    const d = await r.json()
    return {
      symbol: d.symbol,
      price: d.lastPrice,
      priceChangePercent: d.priceChangePercent,
      highPrice: d.highPrice,
      lowPrice: d.lowPrice,
      volume: d.volume,
      quoteVolume: d.quoteVolume,
    }
  },

  /** All USDT-quoted tickers, sorted by quote volume (descending) */
  async getAllTickers(): Promise<BinanceTicker[]> {
    const r = await fetch(`${BINANCE_REST}/ticker/24hr`)
    if (!r.ok) throw new Error('Failed to fetch tickers')
    const data = await r.json()
    return (data as any[])
      .filter(t => t.symbol.endsWith('USDT'))
      .map(t => ({
        symbol: t.symbol,
        price: t.lastPrice,
        priceChangePercent: t.priceChangePercent,
        highPrice: t.highPrice,
        lowPrice: t.lowPrice,
        volume: t.volume,
        quoteVolume: t.quoteVolume,
      }))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
  },

  /** Historical kline data */
  async getCandlesticks(symbol: string, interval = '1m', limit = 500): Promise<CandlestickData[]> {
    const r = await fetch(`${BINANCE_REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
    if (!r.ok) throw new Error(`Failed to fetch candles for ${symbol}`)
    const data = await r.json()
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
    const r = await fetch(`${BINANCE_REST}/depth?symbol=${symbol}&limit=${limit}`)
    if (!r.ok) throw new Error(`Failed to fetch order book for ${symbol}`)
    const d = await r.json()
    return { lastUpdateId: d.lastUpdateId, bids: d.bids, asks: d.asks }
  },
}

// ─── WebSocket manager ──────────────────────────────────────────────────────

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
  const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`).join('/')
  const url = `${BINANCE_WS}/${streams}`
  const ws = new WebSocket(url)

  ws.onmessage = (ev) => {
    try {
      const raw = JSON.parse(ev.data)
      // combined stream wraps in { stream, data }
      const d = raw.data ?? raw
      if (d.e === '24hrMiniTicker') {
        onTicker(d.s, parseFloat(d.c), parseFloat(d.P ?? '0'))
      }
    } catch { /* ignore */ }
  }

  ws.onerror = (e) => console.warn('[WS miniTicker] error', e)

  return { close: () => ws.close() }
}

/**
 * Subscribe to the 24 hr ticker stream for ONE symbol.
 * Fires onTicker with a full BinanceTicker object.
 */
export function subscribeTicker(
  symbol: string,
  onTicker: (t: BinanceTicker) => void,
): WSHandle {
  const ws = new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@ticker`)

  ws.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data)
      if (d.e === '24hrTicker') {
        onTicker({
          symbol: d.s,
          price: d.c,
          priceChangePercent: d.P,
          highPrice: d.h,
          lowPrice: d.l,
          volume: d.v,
          quoteVolume: d.q,
        })
      }
    } catch { /* ignore */ }
  }

  ws.onerror = (e) => console.warn('[WS ticker] error', e)

  return { close: () => ws.close() }
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
  // Use partial book depth stream (no need to maintain local orderbook state)
  const ws = new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@depth${depth}@100ms`)

  ws.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data)
      onBook({
        lastUpdateId: d.lastUpdateId ?? 0,
        bids: d.bids ?? [],
        asks: d.asks ?? [],
      })
    } catch { /* ignore */ }
  }

  ws.onerror = (e) => console.warn('[WS depth] error', e)

  return { close: () => ws.close() }
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
  const ws = new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@kline_${interval}`)

  ws.onmessage = (ev) => {
    try {
      const d = JSON.parse(ev.data)
      if (d.e === 'kline') {
        const k = d.k
        onCandle(
          {
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          },
          k.x, // isFinal
        )
      }
    } catch { /* ignore */ }
  }

  ws.onerror = (e) => console.warn('[WS kline] error', e)

  return { close: () => ws.close() }
}
