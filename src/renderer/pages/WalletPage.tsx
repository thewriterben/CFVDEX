import Panel from '../components/Panel';
import WalletOverview from '../components/WalletOverview';

export default function WalletPage(): JSX.Element {
  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">Wallet Overview</h2>
      <WalletOverview />
    </Panel>
  );
}
