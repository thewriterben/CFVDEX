import { DGF_COINS } from '@shared/constants';

export default function WalletOverview(): JSX.Element {
  return (
    <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {DGF_COINS.map((coin) => (
        <li key={coin} className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
          <p className="text-slate-400">{coin}</p>
          <p className="font-medium">0.00000000</p>
        </li>
      ))}
    </ul>
  );
}
