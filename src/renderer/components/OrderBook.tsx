import type { Order } from '@shared/types';

interface OrderBookProps {
  orders: Order[];
}

export default function OrderBook({ orders }: OrderBookProps): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400">
            <th>ID</th>
            <th>Side</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Maker</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-slate-700">
              <td>{order.id.slice(0, 8)}</td>
              <td className={order.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>{order.side}</td>
              <td>{order.price}</td>
              <td>{order.amount}</td>
              <td>{order.makerPeerId.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
