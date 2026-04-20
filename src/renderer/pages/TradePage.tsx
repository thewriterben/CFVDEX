import { useCallback, useEffect, useState } from 'react';
import OrderBookComponent from '../components/OrderBook';
import PairSelector from '../components/PairSelector';
import Panel from '../components/Panel';
import TradeForm from '../components/TradeForm';
import type { Order } from '@shared/types';
import { getPairs } from '@shared/constants';
import { getOrderBook, cancelOrder } from '../api';

export default function TradePage(): JSX.Element {
  const [pair, setPair] = useState(getPairs()[0]);
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshOrders = useCallback(() => {
    getOrderBook(pair).then((data) => setOrders(data as Order[])).catch(() => {});
  }, [pair]);

  useEffect(() => {
    refreshOrders();
    const interval = setInterval(refreshOrders, 5000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  const handleCancel = (id: string): void => {
    cancelOrder(id).then(refreshOrders).catch(() => {});
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Trading Pair</h2>
        <PairSelector pair={pair} onChange={setPair} />
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Place Order</h2>
        <TradeForm pair={pair} onOrderPlaced={refreshOrders} />
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Order Book</h2>
        <OrderBookComponent orders={orders} onCancel={handleCancel} />
      </Panel>
    </div>
  );
}
