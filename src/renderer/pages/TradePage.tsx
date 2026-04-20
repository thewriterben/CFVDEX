import { useMemo, useState } from 'react';
import OrderBook from '../components/OrderBook';
import PairSelector from '../components/PairSelector';
import Panel from '../components/Panel';
import TradeForm from '../components/TradeForm';
import type { Order } from '@shared/types';
import { getPairs } from '@shared/constants';

export default function TradePage(): JSX.Element {
  const [pair, setPair] = useState(getPairs()[0]);

  const orders: Order[] = useMemo(
    () => [
      {
        id: 'order-1',
        makerPeerId: 'peer-alpha-001',
        pair,
        side: 'buy',
        price: 0.024,
        amount: 1000,
        timestamp: Date.now(),
        ttl: 60000,
        signature: 'stub-signature'
      }
    ],
    [pair]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Trading Pair</h2>
        <PairSelector pair={pair} onChange={setPair} />
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Place Order</h2>
        <TradeForm pair={pair} />
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Order Book</h2>
        <OrderBook orders={orders} />
      </Panel>
    </div>
  );
}
