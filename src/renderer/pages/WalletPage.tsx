import { useEffect, useState } from 'react';
import Panel from '../components/Panel';
import WalletOverview from '../components/WalletOverview';
import { getWalletBalances } from '../api';
import type { CoinBalance } from '../api';

export default function WalletPage(): JSX.Element {
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = (): void => {
      getWalletBalances()
        .then((data) => { setBalances(data); setError(null); })
        .catch(() => setError('Failed to load wallet balances'));
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">Wallet Overview</h2>
      {error && <p className="mb-2 text-sm text-amber-300">{error}</p>}
      <WalletOverview balances={balances} />
    </Panel>
  );
}
