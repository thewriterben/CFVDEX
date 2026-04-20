import { describe, it, expect, beforeEach } from 'vitest';
import { DistributedOrderBook } from '../src/engine/OrderBook';
import type { Order } from '@shared/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    makerPeerId: 'peer-1',
    pair: 'DGB/DASH',
    side: 'buy',
    price: 10,
    amount: 100,
    timestamp: Date.now(),
    ttl: 60_000,
    signature: 'sig',
    ...overrides,
  };
}

describe('DistributedOrderBook', () => {
  let book: DistributedOrderBook;

  beforeEach(() => {
    book = new DistributedOrderBook();
  });

  it('addOrder + listOrders returns the order', () => {
    const order = makeOrder();
    book.addOrder(order);

    const orders = book.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(order.id);
  });

  it('cancelOrder removes the order', () => {
    const order = makeOrder();
    book.addOrder(order);
    book.cancelOrder(order.id);

    expect(book.listOrders()).toHaveLength(0);
  });

  it('listOrders filters by pair', () => {
    book.addOrder(makeOrder({ id: 'o1', pair: 'DGB/DASH' }));
    book.addOrder(makeOrder({ id: 'o2', pair: 'XMR/DASH' }));

    const dgbOrders = book.listOrders('DGB/DASH');
    expect(dgbOrders).toHaveLength(1);
    expect(dgbOrders[0].id).toBe('o1');
  });

  it('expired orders are excluded from listOrders', () => {
    const expired = makeOrder({
      id: 'expired',
      timestamp: Date.now() - 120_000,
      ttl: 60_000,
    });
    const active = makeOrder({ id: 'active' });

    book.addOrder(expired);
    book.addOrder(active);

    const orders = book.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('active');
  });

  it('cleanupExpiredOrders removes expired orders', () => {
    book.addOrder(
      makeOrder({ id: 'expired', timestamp: Date.now() - 120_000, ttl: 60_000 })
    );
    book.addOrder(makeOrder({ id: 'active' }));

    book.cleanupExpiredOrders();

    // After cleanup, even raw CRDT map should not have the expired order
    const orders = book.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('active');
  });

  it('merge applies state from another doc', () => {
    const book2 = new DistributedOrderBook();
    book2.addOrder(makeOrder({ id: 'remote-order' }));

    const update = book2.encodeState();
    book.merge(update);

    const orders = book.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('remote-order');
  });

  it('encodeState creates a valid update that can be merged', () => {
    book.addOrder(makeOrder({ id: 'local-order' }));

    const state = book.encodeState();
    expect(state).toBeInstanceOf(Uint8Array);
    expect(state.length).toBeGreaterThan(0);

    const book2 = new DistributedOrderBook();
    book2.merge(state);

    const orders = book2.listOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('local-order');
  });
});
