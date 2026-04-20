import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwapEngine } from '../src/engine/SwapEngine';
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

describe('SwapEngine', () => {
  let engine: SwapEngine;

  beforeEach(() => {
    engine = new SwapEngine();
  });

  it('initiateSwap creates a valid swap with INITIATED state, secretHash, and 30min TTL', () => {
    const order = makeOrder();
    const swap = engine.initiateSwap(order, 'counterparty-1');

    expect(swap.state).toBe('INITIATED');
    expect(swap.orderId).toBe(order.id);
    expect(swap.counterparty).toBe('counterparty-1');
    expect(swap.secretHash).toBeTruthy();
    expect(swap.secret).toBeTruthy();
    expect(swap.id).toMatch(/^swap-/);
    expect(swap.expiresAt).toBeGreaterThan(Date.now());
    expect(swap.expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000 + 100);
  });

  it('acceptSwap transitions INITIATED → ACCEPTED', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    const accepted = engine.acceptSwap(swap.id);

    expect(accepted.state).toBe('ACCEPTED');
  });

  it('acceptSwap throws on non-INITIATED swap', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    engine.acceptSwap(swap.id);

    expect(() => engine.acceptSwap(swap.id)).toThrow('Swap is not in INITIATED state.');
  });

  it('completeSwap with correct secret transitions ACCEPTED → COMPLETED', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    const secret = swap.secret!;
    engine.acceptSwap(swap.id);

    const completed = engine.completeSwap(swap.id, secret);

    expect(completed.state).toBe('COMPLETED');
    expect(completed.secret).toBe(secret);
  });

  it('completeSwap with wrong secret throws', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    engine.acceptSwap(swap.id);

    expect(() => engine.completeSwap(swap.id, 'wrong-secret')).toThrow('Invalid swap secret.');
  });

  it('completeSwap on non-ACCEPTED swap throws', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');

    expect(() => engine.completeSwap(swap.id, swap.secret!)).toThrow(
      'Swap is not in ACCEPTED state.'
    );
  });

  it('refundSwap sets REFUNDED for non-expired swap', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    const refunded = engine.refundSwap(swap.id);

    expect(refunded.state).toBe('REFUNDED');
  });

  it('refundSwap sets EXPIRED for expired swap', () => {
    const now = Date.now();
    const swap = engine.initiateSwap(makeOrder(), 'cp');

    // Advance time past the swap's expiry
    vi.spyOn(Date, 'now').mockReturnValue(swap.expiresAt + 1);
    const refunded = engine.refundSwap(swap.id);

    expect(refunded.state).toBe('EXPIRED');
    vi.restoreAllMocks();
  });

  it('refundSwap throws on COMPLETED swap', () => {
    const swap = engine.initiateSwap(makeOrder(), 'cp');
    engine.acceptSwap(swap.id);
    engine.completeSwap(swap.id, swap.secret!);

    expect(() => engine.refundSwap(swap.id)).toThrow('Cannot refund completed swap.');
  });

  it('getSwap returns undefined for unknown ID', () => {
    expect(engine.getSwap('nonexistent')).toBeUndefined();
  });
});
