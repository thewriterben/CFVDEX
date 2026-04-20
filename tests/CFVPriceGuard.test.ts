import { describe, it, expect } from 'vitest';
import { CFVPriceGuard } from '../src/cfv/CFVPriceGuard';

describe('CFVPriceGuard', () => {
  const guard = new CFVPriceGuard();

  it('not suspicious when within threshold', () => {
    expect(guard.isSuspicious(105, 100)).toBe(false);
  });

  it('suspicious when above threshold', () => {
    expect(guard.isSuspicious(130, 100)).toBe(true);
  });

  it('not suspicious when fairValue is 0', () => {
    expect(guard.isSuspicious(100, 0)).toBe(false);
  });

  it('not suspicious when fairValue is negative', () => {
    expect(guard.isSuspicious(100, -10)).toBe(false);
  });

  it('custom threshold works', () => {
    const strict = new CFVPriceGuard(5);
    expect(strict.isSuspicious(106, 100)).toBe(true);
    expect(strict.isSuspicious(104, 100)).toBe(false);
  });

  it('exact boundary: 20% deviation is NOT suspicious (uses >)', () => {
    // 120 is exactly 20% above 100
    expect(guard.isSuspicious(120, 100)).toBe(false);
  });

  it('symmetric: works for both overvalued and undervalued', () => {
    // overvalued: 125% of fair value → 25% deviation
    expect(guard.isSuspicious(125, 100)).toBe(true);
    // undervalued: 75% of fair value → 25% deviation
    expect(guard.isSuspicious(75, 100)).toBe(true);
  });
});
