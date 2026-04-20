export const DGF_COINS = [
  'DGB',
  'DASH',
  'XMR',
  'XNO',
  'ZCL',
  'RVN',
  'XEC',
  'EGLD',
  'NEAR',
  'ICP',
  'XCH',
  'DGD'
] as const;

export type CoinSymbol = (typeof DGF_COINS)[number];

export function getPairs(): string[] {
  const pairs: string[] = [];

  DGF_COINS.forEach((base, baseIndex) => {
    DGF_COINS.slice(baseIndex + 1).forEach((quote) => {
      pairs.push(`${base}/${quote}`);
    });
  });

  return pairs;
}
