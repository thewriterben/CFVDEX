import type { CoinSymbol } from './constants';

export type OrderSide = 'buy' | 'sell';

export interface Order {
  id: string;
  makerPeerId: string;
  pair: string;
  side: OrderSide;
  price: number;
  amount: number;
  timestamp: number;
  ttl: number;
  signature: string;
}

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  pair: string;
  price: number;
  amount: number;
  status: 'pending' | 'settled' | 'failed';
  timestamp: number;
}

export interface SwapRecord {
  id: string;
  orderId: string;
  counterparty: string;
  state: 'INITIATED' | 'ACCEPTED' | 'COMPLETED' | 'REFUNDED' | 'EXPIRED';
  secretHash: string;
  secret?: string;
  expiresAt: number;
}

export interface PeerStatus {
  id: string;
  status: 'connected' | 'disconnected';
  reputation: number;
  lastSeen: number;
}

export interface CoinBalance {
  symbol: CoinSymbol;
  balance: number;
  address: string;
}
