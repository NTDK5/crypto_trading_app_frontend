// ─────────────────────────────────────────────────────────────────────────────
// Binance market-data service
// Public REST endpoints and WebSocket streams are called DIRECTLY from the
// browser — Binance CORS-enables all public (unauthenticated) API paths, so no
// backend proxy is needed for market data.  Authenticated calls (trades, wallet,
// auth) still go through the backend.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

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
  time: number   // Unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BINANCE_REST = 'https://api.binance.com/api/v3'
const BINANCE_WS   = 'wss://stream.binance.com:9443/ws'

// ── REST helpers (direct Binance) ─────────────────────────────────────────────

export const binanceService = {
  /** 24 hr ticker for one symbol */
  async getTicker(symbol: string): Promise<BinanceTicker> {
    const sym = symbol.toUpperCase()
    const res = await fetch(`${BINANCE_REST}/ticker/24hr?symbol=${sym}`)
    if (!res.ok) throw new Error(`Binance ticker fetch failed: ${res.status}`)
    const d = await res.json()
    return {
      symbol: d.symbol,
      price: String(d.lastPrice ?? d.price ?? '0'),
      priceChangePercent: String(d.priceChangePercent ?? '0'),
      highPrice: String(d.highPrice ?? '0'),
      lowPrice: String(d.lowPrice ?? '0'),
      volume: String(d.volume ?? '0'),
      quoteVolume: String(d.quoteVolume ?? '0'),
    }
  },

  /** All USDT-quoted tickers sorted by quote volume (descending) */
  async getAllTickers(): Promise<BinanceTicker[]> {
    const res = await fetch(`${BINANCE_REST}/ticker/24hr`)
    if (!res.ok) throw new Error(`Binance allTickers fetch failed: ${res.status}`)
    const data: any[] = await res.json()
    return data
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

  /** Historical kline / candlestick data */
  async getCandlesticks(
    symbol: string,
    interval = '1m',
    limit = 500,
  ): Promise<CandlestickData[]> {
    const sym = symbol.toUpperCase()
    
    // Handle synthetic intervals (5s, 10s)
    let fetchInterval = interval
    let fetchLimit = limit
    let aggregateSeconds = 0

    if (interval === '5s') {
      fetchInterval = '1s'
      fetchLimit = Math.min(limit * 5, 1000) // Binance max limit is 1000
      aggregateSeconds = 5
    } else if (interval === '10s') {
      fetchInterval = '1s'
      fetchLimit = Math.min(limit * 10, 1000)
      aggregateSeconds = 10
    }

    const url = `${BINANCE_REST}/klines?symbol=${sym}&interval=${fetchInterval}&limit=${fetchLimit}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Binance klines fetch failed: ${res.status}`)
    const data: any[][] = await res.json()
    
    let rawCandles = data.map(k => ({
      time: Math.floor(k[0] / 1000),   // ms → seconds
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))

    if (aggregateSeconds > 0) {
      if (rawCandles.length === 0) return []
      const chunks = new Map<number, CandlestickData>()
      for (const c of rawCandles) {
        const aggTime = Math.floor(c.time / aggregateSeconds) * aggregateSeconds
        if (!chunks.has(aggTime)) {
          chunks.set(aggTime, { ...c, time: aggTime })
        } else {
          const existing = chunks.get(aggTime)!
          existing.high = Math.max(existing.high, c.high)
          existing.low = Math.min(existing.low, c.low)
          existing.close = c.close
          existing.volume += c.volume
        }
      }
      return Array.from(chunks.values()).sort((a,b) => a.time - b.time)
    }

    return rawCandles
  },

  /** Order book snapshot */
  async getOrderBook(symbol: string, limit = 20): Promise<BinanceOrderBook> {
    const sym = symbol.toUpperCase()
    const levels = limit <= 5 ? 5 : limit <= 10 ? 10 : 20
    const res = await fetch(`${BINANCE_REST}/depth?symbol=${sym}&limit=${levels}`)
    if (!res.ok) throw new Error(`Binance depth fetch failed: ${res.status}`)
    return res.json()
  },
}

// ── WebSocket helpers (direct Binance) ────────────────────────────────────────

interface WSHandle {
  close: () => void
}

type BookCallback   = (book: BinanceOrderBook) => void
type KlineCallback  = (candle: CandlestickData, isFinal: boolean) => void

// ── Shared multiplexed WS connection ─────────────────────────────────────────
// We open ONE WebSocket to Binance and multiplex all subscriptions over it.
// This stays well under Binance's 5 msg/s and 1024 streams/connection limits.

let sharedWs: WebSocket | null = null
const listeners = new Set<(ev: MessageEvent) => void>()
const pendingSubscriptions = new Map<string, object>()   // key → subscribe msg

function getSharedWs(): WebSocket {
  if (sharedWs && sharedWs.readyState !== WebSocket.CLOSED) return sharedWs

  sharedWs = new WebSocket(BINANCE_WS)

  sharedWs.onopen = () => {
    // Re-send all active subscriptions after (re)connect
    pendingSubscriptions.forEach(msg => {
      try { sharedWs!.send(JSON.stringify(msg)) } catch { /* ignore */ }
    })
  }

  sharedWs.onmessage = (ev) => {
    listeners.forEach(l => { try { l(ev) } catch { /* ignore */ } })
  }

  sharedWs.onerror = () => { /* errors are logged in onclose */ }

  sharedWs.onclose = () => {
    sharedWs = null
    // Auto-reconnect after 3 s if we still have active listeners
    if (listeners.size > 0) {
      setTimeout(() => getSharedWs(), 3000)
    }
  }

  return sharedWs
}

function subscribe(streams: string[], msg: object): void {
  const key = JSON.stringify(streams)
  pendingSubscriptions.set(key, msg)
  const ws = getSharedWs()
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function unsubscribe(streams: string[], msg: object): void {
  const key = JSON.stringify(streams)
  pendingSubscriptions.delete(key)
  if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
    try { sharedWs.send(JSON.stringify(msg)) } catch { /* ignore */ }
  }
}

// ── Public subscribe functions ────────────────────────────────────────────────

export function subscribeTicker(
  symbol: string,
  onTicker: (t: BinanceTicker) => void,
): WSHandle {
  const stream = `${symbol.toLowerCase()}@ticker`
  subscribe([stream], { method: 'SUBSCRIBE', params: [stream], id: Date.now() })

  const handler = (ev: MessageEvent) => {
    try {
      const d = JSON.parse(ev.data)
      // Binance sends: { stream, data } in combined mode OR bare in single mode
      const p = d.data ?? d
      if (p?.e === '24hrTicker' && p?.s === symbol.toUpperCase()) {
        onTicker({
          symbol: p.s,
          price: p.c,
          priceChangePercent: p.P,
          highPrice: p.h,
          lowPrice: p.l,
          volume: p.v,
          quoteVolume: p.q,
        })
      }
    } catch { /* ignore */ }
  }
  listeners.add(handler)

  // Immediate REST snapshot so the UI isn't blank whilst WS handshakes
  binanceService.getTicker(symbol).then(onTicker).catch(() => {})

  return {
    close: () => {
      unsubscribe([stream], { method: 'UNSUBSCRIBE', params: [stream], id: Date.now() })
      listeners.delete(handler)
    },
  }
}

export function subscribeOrderBook(
  symbol: string,
  onBook: BookCallback,
  depth = 20,
): WSHandle {
  const levels = depth <= 5 ? 5 : depth <= 10 ? 10 : 20
  const stream = `${symbol.toLowerCase()}@depth${levels}@100ms`
  subscribe([stream], { method: 'SUBSCRIBE', params: [stream], id: Date.now() })

  const handler = (ev: MessageEvent) => {
    try {
      const d = JSON.parse(ev.data)
      const p = d.data ?? d
      if (p?.bids && p?.asks) {
        onBook(p as BinanceOrderBook)
      }
    } catch { /* ignore */ }
  }
  listeners.add(handler)

  // Immediate REST snapshot
  binanceService.getOrderBook(symbol, levels).then(onBook).catch(() => {})

  return {
    close: () => {
      unsubscribe([stream], { method: 'UNSUBSCRIBE', params: [stream], id: Date.now() })
      listeners.delete(handler)
    },
  }
}

export function subscribeKline(
  symbol: string,
  interval: string,
  onCandle: KlineCallback,
): WSHandle {
  let subInterval = interval
  let aggregateSeconds = 0

  if (interval === '5s') {
    subInterval = '1s'
    aggregateSeconds = 5
  } else if (interval === '10s') {
    subInterval = '1s'
    aggregateSeconds = 10
  }

  const stream = `${symbol.toLowerCase()}@kline_${subInterval}`
  subscribe([stream], { method: 'SUBSCRIBE', params: [stream], id: Date.now() })

  let currentAgg: CandlestickData | null = null
  let aggBaseVolume = 0
  let lastRawTime = 0

  const handler = (ev: MessageEvent) => {
    try {
      const d = JSON.parse(ev.data)
      const p = d.data ?? d
      if (
        p?.e === 'kline' &&
        p?.s === symbol.toUpperCase() &&
        p?.k?.i === subInterval
      ) {
        const k = p.k
        const rawTime = Math.floor(k.t / 1000)

        if (aggregateSeconds > 0) {
          const aggTime = Math.floor(rawTime / aggregateSeconds) * aggregateSeconds
          
          if (!currentAgg || currentAgg.time !== aggTime) {
            currentAgg = {
              time: aggTime,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v)
            }
            aggBaseVolume = 0
            lastRawTime = rawTime
          } else {
            currentAgg.high = Math.max(currentAgg.high, parseFloat(k.h))
            currentAgg.low = Math.min(currentAgg.low, parseFloat(k.l))
            currentAgg.close = parseFloat(k.c)
            
            if (rawTime !== lastRawTime) {
              // Move to a new 1s candle within the same aggregate chunk, lock previous volume
              aggBaseVolume = currentAgg.volume
              lastRawTime = rawTime
            }
            currentAgg.volume = aggBaseVolume + parseFloat(k.v)
          }
          
          onCandle(currentAgg, k.x)
        } else {
          onCandle(
            {
              time: rawTime,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
            },
            k.x, // isFinal: true when the candle closes
          )
        }
      }
    } catch { /* ignore */ }
  }
  listeners.add(handler)

  return {
    close: () => {
      unsubscribe([stream], { method: 'UNSUBSCRIBE', params: [stream], id: Date.now() })
      listeners.delete(handler)
    },
  }
}

/** Mini-ticker stream for the market list (subscribes to many symbols at once) */
export function subscribeMiniTickers(
  symbols: string[],
  onTicker: (symbol: string, price: number, changePct: number) => void,
): WSHandle {
  const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`)
  subscribe(streams, { method: 'SUBSCRIBE', params: streams, id: Date.now() })

  const wantedSet = new Set(symbols.map(s => s.toUpperCase()))

  const handler = (ev: MessageEvent) => {
    try {
      const d = JSON.parse(ev.data)
      const p = d.data ?? d
      if (p?.e === '24hrMiniTicker' && wantedSet.has(p?.s)) {
        onTicker(p.s, parseFloat(p.c), parseFloat(p.P ?? '0'))
      }
    } catch { /* ignore */ }
  }
  listeners.add(handler)

  // Immediate REST snapshot
  binanceService.getAllTickers().then(tickers => {
    tickers
      .filter(t => wantedSet.has(t.symbol.toUpperCase()))
      .forEach(t => onTicker(t.symbol, parseFloat(t.price), parseFloat(t.priceChangePercent || '0')))
  }).catch(() => {})

  return {
    close: () => {
      unsubscribe(streams, { method: 'UNSUBSCRIBE', params: streams, id: Date.now() })
      listeners.delete(handler)
    },
  }
}
