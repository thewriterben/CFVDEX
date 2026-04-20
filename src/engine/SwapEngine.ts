import { createHash, randomBytes } from 'node:crypto';
import type { Order, SwapRecord } from '@shared/types';

export class SwapEngine {
  private readonly swaps = new Map<string, SwapRecord>();

  initiateSwap(order: Order, counterparty: string): SwapRecord {
    const secret = randomBytes(32).toString('hex');
    const secretHash = createHash('sha256').update(secret).digest('hex');
    const id = `swap-${Date.now()}-${randomBytes(4).toString('hex')}`;

    const swap: SwapRecord = {
      id,
      orderId: order.id,
      counterparty,
      state: 'INITIATED',
      secretHash,
      secret,
      expiresAt: Date.now() + 30 * 60 * 1000
    };

    this.swaps.set(id, swap);
    return swap;
  }

  acceptSwap(swapId: string): SwapRecord {
    const swap = this.mustGet(swapId);
    if (swap.state !== 'INITIATED') {
      throw new Error('Swap is not in INITIATED state.');
    }

    swap.state = 'ACCEPTED';
    return swap;
  }

  completeSwap(swapId: string, secret: string): SwapRecord {
    const swap = this.mustGet(swapId);
    if (swap.state !== 'ACCEPTED') {
      throw new Error('Swap is not in ACCEPTED state.');
    }

    const providedHash = createHash('sha256').update(secret).digest('hex');
    if (providedHash !== swap.secretHash) {
      throw new Error('Invalid swap secret.');
    }

    swap.secret = secret;
    swap.state = 'COMPLETED';
    return swap;
  }

  refundSwap(swapId: string): SwapRecord {
    const swap = this.mustGet(swapId);
    if (swap.state === 'COMPLETED') {
      throw new Error('Cannot refund completed swap.');
    }

    swap.state = Date.now() >= swap.expiresAt ? 'EXPIRED' : 'REFUNDED';
    return swap;
  }

  getSwap(swapId: string): SwapRecord | undefined {
    return this.swaps.get(swapId);
  }

  private mustGet(swapId: string): SwapRecord {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error(`Swap ${swapId} not found.`);
    }
    return swap;
  }
}
