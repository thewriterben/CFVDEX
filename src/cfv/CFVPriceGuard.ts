export class CFVPriceGuard {
  constructor(private readonly thresholdPct = 20) {}

  isSuspicious(marketPrice: number, fairValue: number): boolean {
    if (fairValue <= 0) {
      return false;
    }

    const deviationPct = Math.abs(((marketPrice - fairValue) / fairValue) * 100);
    return deviationPct > this.thresholdPct;
  }
}
