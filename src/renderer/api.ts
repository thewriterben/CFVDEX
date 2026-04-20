const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Orders ──────────────────────────────────────────────────────────

export interface PlaceOrderPayload {
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
}

export interface PlaceOrderResult {
  id: string;
  cfvWarning?: string;
}

export function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(orderId: string): Promise<{ success: boolean }> {
  return request(`/orders/${orderId}`, { method: 'DELETE' });
}

export function getOrderBook(pair?: string): Promise<unknown[]> {
  const query = pair ? `?pair=${encodeURIComponent(pair)}` : '';
  return request(`/orders${query}`);
}

// ── Trades ──────────────────────────────────────────────────────────

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

export function getTrades(pair?: string, status?: string): Promise<Trade[]> {
  const params = new URLSearchParams();
  if (pair) params.set('pair', pair);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params}` : '';
  return request(`/trades${query}`);
}

// ── Swaps ───────────────────────────────────────────────────────────

export interface SwapRecord {
  id: string;
  orderId: string;
  counterparty: string;
  state: 'INITIATED' | 'ACCEPTED' | 'COMPLETED' | 'REFUNDED' | 'EXPIRED';
  secretHash: string;
  secret?: string;
  expiresAt: number;
}

export function getSwaps(state?: string): Promise<SwapRecord[]> {
  const query = state ? `?state=${encodeURIComponent(state)}` : '';
  return request(`/swaps${query}`);
}

// ── Wallets ─────────────────────────────────────────────────────────

export interface CoinBalance {
  symbol: string;
  balance: number;
  address: string;
}

export function getWalletBalances(): Promise<CoinBalance[]> {
  return request('/wallets/balances');
}

export function getWalletAddress(symbol: string): Promise<{ symbol: string; address: string }> {
  return request(`/wallets/${symbol}/address`);
}

// ── Peers ───────────────────────────────────────────────────────────

export interface PeerStatus {
  id: string;
  status: 'connected' | 'disconnected';
  reputation: number;
  lastSeen: number;
}

export function getPeers(): Promise<PeerStatus[]> {
  return request('/peers');
}

// ── Node Status ─────────────────────────────────────────────────────

export interface NodeStatus {
  nodeId: string | null;
  peerCount: number;
  totalPeers: number;
  addresses: string[];
  online: boolean;
}

export function getNodeStatus(): Promise<NodeStatus> {
  return request('/node/status');
}

// ── CFV ─────────────────────────────────────────────────────────────

export interface CFVCacheEntry {
  symbol: string;
  fairValue: number;
  marketPrice: number;
  valuationStatus: string;
  updatedAt: number;
}

export function getCFVMetrics(): Promise<CFVCacheEntry[]> {
  return request('/cfv/metrics');
}

export function getCFVPrice(symbol: string): Promise<{ symbol: string; fairValue: number | null }> {
  return request(`/cfv/metrics/${symbol}`);
}

// ── Settings ────────────────────────────────────────────────────────

export function getSettings(): Promise<Record<string, string>> {
  return request('/settings');
}

export function saveSettings(settings: Record<string, string>): Promise<{ success: boolean }> {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ── Constants ───────────────────────────────────────────────────────

export function getCoins(): Promise<string[]> {
  return request('/coins');
}

export function getPairs(): Promise<string[]> {
  return request('/pairs');
}

// ── WebSocket ───────────────────────────────────────────────────────

export type WSEventHandler = (event: string, data: unknown) => void;

export function connectWebSocket(onMessage: WSEventHandler): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const { event: eventName, data } = JSON.parse(event.data);
      onMessage(eventName, data);
    } catch {
      // Ignore malformed messages
    }
  };

  ws.onclose = () => {
    // Reconnect after 3 seconds
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  return ws;
}
