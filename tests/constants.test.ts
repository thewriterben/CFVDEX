import { describe, it, expect } from 'vitest';
import { getPairs } from '@shared/constants';

describe('getPairs', () => {
  it('returns 66 pairs from 12 coins (12 choose 2 = 66)', () => {
    const pairs = getPairs();
    expect(pairs).toHaveLength(66);
  });

  it('all pairs are in "BASE/QUOTE" format', () => {
    const pairs = getPairs();
    for (const pair of pairs) {
      expect(pair).toMatch(/^[A-Z]+\/[A-Z]+$/);
    }
  });

  it('no duplicate pairs', () => {
    const pairs = getPairs();
    const unique = new Set(pairs);
    expect(unique.size).toBe(pairs.length);
  });
});
