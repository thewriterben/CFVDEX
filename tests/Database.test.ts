import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseManager } from '../src/database/Database';
import type { Order, Trade, SwapRecord, PeerStatus } from '@shared/types';

let db: DatabaseManager;

beforeEach(() => {
  db = new DatabaseManager(':memory:');
});

const sampleOrder: Order = {
  id: 'order-1',
  makerPeerId: 'peer-1',
  pair: 'DGB/DASH',
  side: 'buy',
  price: 10,
  amount: 100,
  timestamp: Date.now(),
  ttl: 60_000,
  signature: 'sig-1',
};

const sampleTrade: Trade = {
  id: 'trade-1',
  buyOrderId: 'order-1',
  sellOrderId: 'order-2',
  pair: 'DGB/DASH',
  price: 10,
  amount: 50,
  status: 'pending',
  timestamp: Date.now(),
};

const sampleSwap: SwapRecord = {
  id: 'swap-1',
  orderId: 'order-1',
  counterparty: 'peer-2',
  state: 'INITIATED',
  secretHash: 'abc123',
  expiresAt: Date.now() + 30 * 60 * 1000,
};

const samplePeer: PeerStatus = {
  id: 'peer-1',
  status: 'connected',
  reputation: 0.5,
  lastSeen: Date.now(),
};

describe('DatabaseManager - Orders', () => {
  it('insertOrder + findOrderById returns the order', () => {
    db.insertOrder(sampleOrder);
    const found = db.findOrderById('order-1');

    expect(found).toBeDefined();
    expect(found!.id).toBe('order-1');
    expect(found!.pair).toBe('DGB/DASH');
    expect(found!.side).toBe('buy');
  });

  it('findOrdersByPair filters correctly', () => {
    db.insertOrder(sampleOrder);
    db.insertOrder({ ...sampleOrder, id: 'order-2', pair: 'XMR/DASH' });

    const dgbOrders = db.findOrdersByPair('DGB/DASH');
    expect(dgbOrders).toHaveLength(1);
    expect(dgbOrders[0].id).toBe('order-1');
  });

  it('deleteOrder removes the order', () => {
    db.insertOrder(sampleOrder);
    db.deleteOrder('order-1');

    expect(db.findOrderById('order-1')).toBeUndefined();
  });
});

describe('DatabaseManager - Trades', () => {
  it('insertTrade + findTradeById', () => {
    db.insertTrade(sampleTrade);
    const found = db.findTradeById('trade-1');

    expect(found).toBeDefined();
    expect(found!.id).toBe('trade-1');
    expect(found!.status).toBe('pending');
  });

  it('updateTradeStatus changes status', () => {
    db.insertTrade(sampleTrade);
    db.updateTradeStatus('trade-1', 'settled');

    const found = db.findTradeById('trade-1');
    expect(found!.status).toBe('settled');
  });
});

describe('DatabaseManager - Swaps', () => {
  it('insertSwap + findSwapById', () => {
    db.insertSwap(sampleSwap);
    const found = db.findSwapById('swap-1');

    expect(found).toBeDefined();
    expect(found!.id).toBe('swap-1');
    expect(found!.state).toBe('INITIATED');
  });

  it('updateSwapState changes state', () => {
    db.insertSwap(sampleSwap);
    db.updateSwapState('swap-1', 'ACCEPTED');

    const found = db.findSwapById('swap-1');
    expect(found!.state).toBe('ACCEPTED');
  });

  it('findSwapsByState filters correctly', () => {
    db.insertSwap(sampleSwap);
    db.insertSwap({ ...sampleSwap, id: 'swap-2', state: 'COMPLETED' });

    const initiated = db.findSwapsByState('INITIATED');
    expect(initiated).toHaveLength(1);
    expect(initiated[0].id).toBe('swap-1');
  });
});

describe('DatabaseManager - Peers', () => {
  it('upsertPeer + findPeerById', () => {
    db.upsertPeer(samplePeer);
    const found = db.findPeerById('peer-1');

    expect(found).toBeDefined();
    expect(found!.id).toBe('peer-1');
    expect(found!.reputation).toBe(0.5);
  });
});

describe('DatabaseManager - Settings', () => {
  it('setSetting + getSetting', () => {
    db.setSetting('theme', 'dark');
    const setting = db.getSetting('theme');

    expect(setting).toBeDefined();
    expect(setting!.key).toBe('theme');
    expect(setting!.value).toBe('dark');
  });
});

describe('DatabaseManager - CFV Cache', () => {
  it('upsertCFVCache + findCFVCacheBySymbol', () => {
    db.upsertCFVCache({
      symbol: 'DGB',
      fairValue: 0.01,
      marketPrice: 0.012,
      valuationStatus: 'overvalued',
      updatedAt: Date.now(),
    });

    const found = db.findCFVCacheBySymbol('DGB');
    expect(found).toBeDefined();
    expect(found!.symbol).toBe('DGB');
    expect(found!.fairValue).toBe(0.01);
  });
});
