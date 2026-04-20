import { useEffect, useState } from 'react';
import Panel from '../components/Panel';
import TradeHistory from '../components/TradeHistory';
import type { Trade } from '@shared/types';
import { getTrades } from '../api';

export default function HistoryPage(): JSX.Element {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrades(undefined, statusFilter || undefined)
      .then((data) => { setTrades(data); setError(null); })
      .catch(() => setError('Failed to load trade history'));
  }, [statusFilter]);

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trade History</h2>
        <select
          className="rounded bg-slate-900 px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      {error && <p className="mb-2 text-sm text-amber-300">{error}</p>}
      <TradeHistory trades={trades} />
    </Panel>
  );
}
