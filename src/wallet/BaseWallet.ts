import { createHash, randomUUID } from 'node:crypto';
import type { IWallet } from './IWallet';

export class BaseWallet implements IWallet {
  constructor(public readonly symbol: string) {}

  async generateAddress(): Promise<string> {
    return `${this.symbol.toLowerCase()}_${randomUUID().replaceAll('-', '')}`;
  }

  async getBalance(): Promise<number> {
    return 0;
  }

  async createHTLC(): Promise<string> {
    return `${this.symbol.toLowerCase()}_htlc_${randomUUID()}`;
  }

  async claimHTLC({ contractId, secret }: { contractId: string; secret: string }): Promise<string> {
    return `${contractId}_claim_${createHash('sha256').update(secret).digest('hex').slice(0, 12)}`;
  }

  async refundHTLC({ contractId }: { contractId: string }): Promise<string> {
    return `${contractId}_refund`;
  }

  async signMessage(message: string): Promise<string> {
    return createHash('sha256').update(`${this.symbol}:${message}`).digest('hex');
  }
}
