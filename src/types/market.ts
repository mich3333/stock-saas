export interface OHLCV {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlineData {
  t: number;  // kline open time
  T: number;  // kline close time
  s: string;  // symbol
  i: string;  // interval
  o: string;  // open
  h: string;  // high
  l: string;  // low
  c: string;  // close
  v: string;  // volume
  x: boolean; // is this kline closed?
}

export interface WebSocketMessage {
  e: string;     // event type
  E: number;     // event time
  s: string;     // symbol
  k: KlineData;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
