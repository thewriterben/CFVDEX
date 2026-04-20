import CFVPriceBar from '../components/CFVPriceBar';
import Panel from '../components/Panel';

export default function DashboardPage(): JSX.Element {
  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="mb-2 text-lg font-semibold">Market Snapshot</h2>
        <CFVPriceBar coin="DGB" marketPrice={0.025} fairValue={0.023} />
      </Panel>
    </div>
  );
}
