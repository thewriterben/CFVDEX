import type { Trade } from '@shared/types';

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps): JSX.Element {
  return (
    <ul className="space-y-2">
      {trades.map((trade) => (
        <li key={trade.id} className="rounded border border-slate-700 bg-slate-900 p-3 text-sm">
          <div className="flex justify-between">
            <span>{trade.pair}</span>
            <span>{trade.status}</span>
          </div>
          <p>
            {trade.amount} @ {trade.price}
          </p>
        </li>
      ))}
    </ul>
  );
}
