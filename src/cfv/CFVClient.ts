import type { CoinSymbol } from '@shared/constants';

export interface CFVMetrics {
  symbol: CoinSymbol;
  fairValue: number;
  marketPrice: number;
  valuationStatus: 'undervalued' | 'fair' | 'overvalued';
  updatedAt: string;
}

export class CFVClient {
  constructor(private readonly baseUrl = 'http://localhost:3001') {}

  async getFairValue(coinSymbol: CoinSymbol): Promise<number | null> {
    const response = await fetch(`${this.baseUrl}/metrics/${coinSymbol}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { fairValue?: number };
    return payload.fairValue ?? null;
  }

  async getAllCoinMetrics(): Promise<CFVMetrics[]> {
    const response = await fetch(`${this.baseUrl}/metrics`);
    if (!response.ok) {
      return [];
    }

    return (await response.json()) as CFVMetrics[];
  }

  async getValuationStatus(coinSymbol: CoinSymbol): Promise<CFVMetrics['valuationStatus'] | null> {
    const response = await fetch(`${this.baseUrl}/valuation/${coinSymbol}`);
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { status?: CFVMetrics['valuationStatus'] };
    return payload.status ?? null;
  }
}
