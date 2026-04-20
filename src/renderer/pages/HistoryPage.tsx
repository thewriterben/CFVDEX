import Panel from '../components/Panel';
import TradeHistory from '../components/TradeHistory';
import type { Trade } from '@shared/types';

const mockTrades: Trade[] = [
  {
    id: 'trade-1',
    buyOrderId: 'buy-1',
    sellOrderId: 'sell-1',
    pair: 'DGB/XNO',
    price: 0.024,
    amount: 100,
    status: 'settled',
    timestamp: Date.now()
  }
];

export default function HistoryPage(): JSX.Element {
  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">Trade History</h2>
      <TradeHistory trades={mockTrades} />
    </Panel>
  );
}
