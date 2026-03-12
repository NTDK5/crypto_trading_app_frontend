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

// ─── Realtime-ish helpers via Backend WS Proxy ───────────────
type BookCallback = (book: BinanceOrderBook) => void;
type KlineCallback = (candle: CandlestickData, isFinal: boolean) => void;

interface WSHandle {
  close: () => void;
}

const WS_URL = (import.meta.env.VITE_API_URL || window.location.origin + '/api').replace(/^http/, 'ws') + '/ws/market';

let sharedWs: WebSocket | null = null;
const listeners = new Set<(ev: MessageEvent) => void>();

function getSharedWs() {
  if (!sharedWs || sharedWs.readyState === WebSocket.CLOSED) {
    sharedWs = new WebSocket(WS_URL);
    sharedWs.onmessage = (ev) => {
      listeners.forEach((l) => l(ev));
    };
    sharedWs.onclose = () => {
      setTimeout(() => getSharedWs(), 3000); // auto-reconnect
    };
  }
  return sharedWs;
}

function sendWsMessage(msg: any) {
  const ws = getSharedWs();
  const rawMsg = JSON.stringify(msg);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(rawMsg);
  } else {
    ws.addEventListener('open', () => ws.send(rawMsg), { once: true });
  }
}

export function subscribeMiniTickers(
  symbols: string[],
  onTicker: (symbol: string, price: number, changePct: number) => void,
): WSHandle {
  const streams = symbols.map(s => `${s.toLowerCase()}@ticker`);
  sendWsMessage({ method: "SUBSCRIBE", params: streams, id: Date.now() });

  const handler = (ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      // Data might be from bare stream or combined stream mapping
      const streamData = data.data ? data.data : data;
      if (streamData && streamData.e === '24hrTicker') {
        const sym = streamData.s.toUpperCase();
        if (symbols.map(s => s.toUpperCase()).includes(sym)) {
          onTicker(sym, parseFloat(streamData.c), parseFloat(streamData.P));
        }
      }
    } catch { /* ignore */ }
  };
  listeners.add(handler);

  // Still do an initial fetch to populate UI immediately
  binanceService.getAllTickers().then(tickers => {
    const wanted = new Set(symbols.map(s => s.toUpperCase()));
    tickers
      .filter(t => wanted.has(t.symbol.toUpperCase()))
      .forEach(t => onTicker(t.symbol, parseFloat(t.price), parseFloat(t.priceChangePercent || '0')));
  }).catch(() => {});

  return {
    close: () => {
      sendWsMessage({ method: "UNSUBSCRIBE", params: streams, id: Date.now() });
      listeners.delete(handler);
    },
  };
}

export function subscribeTicker(
  symbol: string,
  onTicker: (t: BinanceTicker) => void,
): WSHandle {
  const stream = `${symbol.toLowerCase()}@ticker`;
  sendWsMessage({ method: "SUBSCRIBE", params: [stream], id: Date.now() });

  const handler = (ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      const streamData = data.data ? data.data : data;
      if (streamData && streamData.e === '24hrTicker' && streamData.s === symbol.toUpperCase()) {
        onTicker({
          symbol: streamData.s,
          price: streamData.c,
          priceChangePercent: streamData.P,
          highPrice: streamData.h,
          lowPrice: streamData.l,
          volume: streamData.v,
          quoteVolume: streamData.q,
        });
      }
    } catch { /* ignore */ }
  };
  listeners.add(handler);

  binanceService.getTicker(symbol).then(onTicker).catch(() => {});

  return {
    close: () => {
      sendWsMessage({ method: "UNSUBSCRIBE", params: [stream], id: Date.now() });
      listeners.delete(handler);
    },
  };
}

export function subscribeOrderBook(
  symbol: string,
  onBook: BookCallback,
  depth = 10,
): WSHandle {
  // Binance provides partial book depth streams, e.g. <symbol>@depth<levels>@100ms
  // valid levels are 5, 10, or 20.
  const levels = depth <= 5 ? 5 : depth <= 10 ? 10 : 20;
  const stream = `${symbol.toLowerCase()}@depth${levels}@100ms`;
  sendWsMessage({ method: "SUBSCRIBE", params: [stream], id: Date.now() });

  const handler = (ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      const streamData = data.data ? data.data : data;
      // Partial book depth returns no distinct 'e' field, but it has 'lastUpdateId' and 'bids' / 'asks'
      // If it comes through combined streams it will have stream matching our request
      const isDepth = data.stream === stream || (streamData.bids && streamData.asks);
      
      if (isDepth && streamData.bids) {
        onBook(streamData as BinanceOrderBook);
      }
    } catch { /* ignore */ }
  };
  listeners.add(handler);

  // Initial fetch for fast load
  binanceService.getOrderBook(symbol, levels).then(onBook).catch(() => {});

  return {
    close: () => {
      sendWsMessage({ method: "UNSUBSCRIBE", params: [stream], id: Date.now() });
      listeners.delete(handler);
    },
  };
}

export function subscribeKline(
  symbol: string,
  interval: string,
  onCandle: KlineCallback,
): WSHandle {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  sendWsMessage({ method: "SUBSCRIBE", params: [stream], id: Date.now() });

  const handler = (ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      const streamData = data.data ? data.data : data;
      if (streamData && streamData.e === 'kline' && streamData.s === symbol.toUpperCase() && streamData.k.i === interval) {
        const k = streamData.k;
        onCandle({
          time: k.t / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        }, k.x);
      }
    } catch { /* ignore */ }
  };
  listeners.add(handler);

  // Initial fetch to paint the chart
  binanceService.getCandlesticks(symbol, interval, 500).then(candles => {
    if (candles.length > 0) {
      onCandle(candles[candles.length - 1], false);
    }
  }).catch(() => {});

  return {
    close: () => {
      sendWsMessage({ method: "UNSUBSCRIBE", params: [stream], id: Date.now() });
      listeners.delete(handler);
    },
  };
}
