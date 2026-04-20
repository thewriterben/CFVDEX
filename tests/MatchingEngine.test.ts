import { describe, it, expect } from 'vitest';
import { MatchingEngine } from '../src/engine/MatchingEngine';
import type { Order } from '@shared/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    makerPeerId: 'peer-1',
    pair: 'DGB/DASH',
    side: 'buy',
    price: 10,
    amount: 100,
    timestamp: 1000,
    ttl: 60_000,
    signature: 'sig',
    ...overrides,
  };
}

describe('MatchingEngine', () => {
  const engine = new MatchingEngine();

  it('matches a buy and sell with crossing prices at sell price', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b1', side: 'buy', price: 11, amount: 50 }),
      makeOrder({ id: 's1', side: 'sell', price: 9, amount: 50 }),
    ];

    const matches = engine.match(orders);

    expect(matches).toHaveLength(1);
    expect(matches[0].amount).toBe(50);
    expect(matches[0].price).toBe(9);
  });

  it('returns no match when buy.price < sell.price', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b1', side: 'buy', price: 8 }),
      makeOrder({ id: 's1', side: 'sell', price: 10 }),
    ];

    expect(engine.match(orders)).toHaveLength(0);
  });

  it('partial fill: buy 100 at 10, sell 50 at 9 → match 50, buy has 50 remaining', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b1', side: 'buy', price: 10, amount: 100 }),
      makeOrder({ id: 's1', side: 'sell', price: 9, amount: 50 }),
    ];

    const matches = engine.match(orders);

    expect(matches).toHaveLength(1);
    expect(matches[0].amount).toBe(50);
    expect(matches[0].buyOrder.amount).toBe(50);
  });

  it('handles multiple matches in a book', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b1', side: 'buy', price: 12, amount: 30, timestamp: 1000 }),
      makeOrder({ id: 'b2', side: 'buy', price: 11, amount: 40, timestamp: 1001 }),
      makeOrder({ id: 's1', side: 'sell', price: 9, amount: 20, timestamp: 1002 }),
      makeOrder({ id: 's2', side: 'sell', price: 10, amount: 50, timestamp: 1003 }),
    ];

    const matches = engine.match(orders);

    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches[0].buyOrder.id).toBe('b1');
    expect(matches[0].sellOrder.id).toBe('s1');
    expect(matches[0].amount).toBe(20);

    expect(matches[1].buyOrder.id).toBe('b1');
    expect(matches[1].sellOrder.id).toBe('s2');
    expect(matches[1].amount).toBe(10);
  });

  it('returns no matches for an empty order book', () => {
    expect(engine.match([])).toHaveLength(0);
  });

  it('does not match orders of different pairs', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b1', side: 'buy', price: 10, pair: 'DGB/DASH' }),
      makeOrder({ id: 's1', side: 'sell', price: 9, pair: 'XMR/DASH' }),
    ];

    expect(engine.match(orders)).toHaveLength(0);
  });

  it('price-time priority: earlier timestamp wins', () => {
    const orders: Order[] = [
      makeOrder({ id: 'b-early', side: 'buy', price: 10, amount: 50, timestamp: 1000 }),
      makeOrder({ id: 'b-late', side: 'buy', price: 10, amount: 50, timestamp: 2000 }),
      makeOrder({ id: 's1', side: 'sell', price: 9, amount: 50 }),
    ];

    const matches = engine.match(orders);

    expect(matches).toHaveLength(1);
    expect(matches[0].buyOrder.id).toBe('b-early');
  });
});
