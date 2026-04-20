interface CFVPriceBarProps {
  coin: string;
  marketPrice: number;
  fairValue: number;
}

export default function CFVPriceBar({ coin, marketPrice, fairValue }: CFVPriceBarProps): JSX.Element {
  const deltaPct = fairValue > 0 ? ((marketPrice - fairValue) / fairValue) * 100 : 0;
  const warning = Math.abs(deltaPct) > 20;

  return (
    <div className={`rounded border p-3 ${warning ? 'border-amber-400' : 'border-slate-700'} bg-slate-900`}>
      <div className="flex justify-between text-sm">
        <span>{coin} CFV Guard</span>
        <span className={warning ? 'text-amber-300' : 'text-slate-400'}>{deltaPct.toFixed(2)}%</span>
      </div>
      <p className="text-xs text-slate-400">Market {marketPrice.toFixed(8)} vs CFV {fairValue.toFixed(8)}</p>
    </div>
  );
}
