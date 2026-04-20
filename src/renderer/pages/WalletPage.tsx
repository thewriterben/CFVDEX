import { useEffect, useState } from 'react';
import Panel from '../components/Panel';
import WalletOverview from '../components/WalletOverview';
import { getWalletBalances } from '../api';
import type { CoinBalance } from '../api';

export default function WalletPage(): JSX.Element {
  const [balances, setBalances] = useState<CoinBalance[]>([]);

  useEffect(() => {
    getWalletBalances().then(setBalances).catch(() => {});
    const interval = setInterval(() => {
      getWalletBalances().then(setBalances).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">Wallet Overview</h2>
      <WalletOverview balances={balances} />
    </Panel>
  );
}
