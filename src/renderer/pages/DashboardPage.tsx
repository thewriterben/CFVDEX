import { useEffect, useState } from 'react';
import CFVPriceBar from '../components/CFVPriceBar';
import Panel from '../components/Panel';
import { getCFVMetrics, getNodeStatus, getTrades } from '../api';
import type { CFVCacheEntry, NodeStatus, Trade } from '../api';
import { DGF_COINS } from '@shared/constants';

export default function DashboardPage(): JSX.Element {
  const [metrics, setMetrics] = useState<CFVCacheEntry[]>([]);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  useEffect(() => {
    getCFVMetrics().then(setMetrics).catch(() => {});
    getNodeStatus().then(setNodeStatus).catch(() => {});
    getTrades().then((trades) => setRecentTrades(trades.slice(-5).reverse())).catch(() => {});

    const interval = setInterval(() => {
      getCFVMetrics().then(setMetrics).catch(() => {});
      getNodeStatus().then(setNodeStatus).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="mb-2 text-lg font-semibold">Node Status</h2>
        {nodeStatus ? (
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div>
              <p className="text-slate-400">Status</p>
              <p className={nodeStatus.online ? 'text-emerald-400' : 'text-rose-400'}>
                {nodeStatus.online ? 'Online' : 'Offline'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Peers</p>
              <p>{nodeStatus.peerCount} connected</p>
            </div>
            <div>
              <p className="text-slate-400">Node ID</p>
              <p className="truncate">{nodeStatus.nodeId?.slice(0, 16) ?? 'N/A'}…</p>
            </div>
            <div>
              <p className="text-slate-400">Addresses</p>
              <p>{nodeStatus.addresses.length} listening</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-2 text-lg font-semibold">Market Snapshot (CFV Metrics)</h2>
        {metrics.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <CFVPriceBar
                key={m.symbol}
                coin={m.symbol}
                marketPrice={m.marketPrice}
                fairValue={m.fairValue}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {DGF_COINS.map((coin) => (
              <CFVPriceBar key={coin} coin={coin} marketPrice={0} fairValue={0} />
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-2 text-lg font-semibold">Recent Trades</h2>
        {recentTrades.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {recentTrades.map((t) => (
              <li key={t.id} className="flex justify-between border-t border-slate-700 py-1">
                <span>{t.pair}</span>
                <span>{t.amount} @ {t.price}</span>
                <span className={
                  t.status === 'settled'
                    ? 'text-emerald-400'
                    : t.status === 'failed'
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }>{t.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No trades yet</p>
        )}
      </Panel>
    </div>
  );
}
