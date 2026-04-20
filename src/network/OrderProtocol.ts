import { createHash, createSign, createVerify } from 'node:crypto';
import type { Order } from '@shared/types';
import type { Libp2p } from 'libp2p';

export const ORDER_TOPIC = '/cfvdex/orders/1.0.0';
export const CANCEL_TOPIC = '/cfvdex/cancels/1.0.0';

interface PubsubService {
  publish: (topic: string, data: Uint8Array) => Promise<void>;
}

export class OrderProtocol {
  constructor(private readonly node: Libp2p) {}

  async publishOrder(order: Order): Promise<void> {
    const pubsub = (this.node.services as Record<string, unknown>).pubsub as PubsubService | undefined;
    if (!pubsub) {
      return;
    }

    await pubsub.publish(ORDER_TOPIC, new TextEncoder().encode(JSON.stringify(order)));
  }

  async publishCancel(orderId: string): Promise<void> {
    const pubsub = (this.node.services as Record<string, unknown>).pubsub as PubsubService | undefined;
    if (!pubsub) {
      return;
    }

    await pubsub.publish(CANCEL_TOPIC, new TextEncoder().encode(JSON.stringify({ orderId, ts: Date.now() })));
  }

  static signOrderPayload(order: Omit<Order, 'signature'>, privateKeyPem: string): string {
    const sign = createSign('SHA256');
    const payload = OrderProtocol.toStablePayload(order);
    sign.update(payload);
    sign.end();
    return sign.sign(privateKeyPem, 'base64');
  }

  static verifyOrderPayload(order: Order, publicKeyPem: string): boolean {
    const verify = createVerify('SHA256');
    const { signature, ...unsigned } = order;
    verify.update(OrderProtocol.toStablePayload(unsigned));
    verify.end();
    return verify.verify(publicKeyPem, signature, 'base64');
  }

  static digest(order: Omit<Order, 'signature'>): string {
    return createHash('sha256').update(OrderProtocol.toStablePayload(order)).digest('hex');
  }

  private static toStablePayload(order: Omit<Order, 'signature'>): string {
    return JSON.stringify(order, Object.keys(order).sort());
  }
}
