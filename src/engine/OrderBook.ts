import * as Y from 'yjs';
import type { Order } from '@shared/types';

export class DistributedOrderBook {
  private readonly doc = new Y.Doc();
  private readonly map = this.doc.getMap<Order>('orders');

  addOrder(order: Order): void {
    this.map.set(order.id, order);
  }

  cancelOrder(orderId: string): void {
    this.map.delete(orderId);
  }

  merge(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  encodeState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  listOrders(pair?: string): Order[] {
    const now = Date.now();
    return [...this.map.values()]
      .filter((order) => order.timestamp + order.ttl > now)
      .filter((order) => (pair ? order.pair === pair : true))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  cleanupExpiredOrders(): void {
    const now = Date.now();
    for (const [id, order] of this.map.entries()) {
      if (order.timestamp + order.ttl <= now) {
        this.map.delete(id);
      }
    }
  }
}
