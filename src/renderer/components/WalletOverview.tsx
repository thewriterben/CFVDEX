import { DGF_COINS } from '@shared/constants';
import type { CoinBalance } from '../api';

interface WalletOverviewProps {
  balances: CoinBalance[];
}

export default function WalletOverview({ balances }: WalletOverviewProps): JSX.Element {
  const balanceMap = new Map(balances.map((b) => [b.symbol, b]));

  return (
    <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {DGF_COINS.map((coin) => {
        const entry = balanceMap.get(coin);
        return (
          <li key={coin} className="rounded border border-slate-700 bg-slate-900 px-3 py-2">
            <p className="text-slate-400">{coin}</p>
            <p className="font-medium">{entry ? entry.balance.toFixed(8) : '0.00000000'}</p>
            {entry?.address && (
              <p className="truncate text-xs text-slate-500">{entry.address}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
