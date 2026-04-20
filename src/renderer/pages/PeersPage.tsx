import { useEffect, useState } from 'react';
import Panel from '../components/Panel';
import PeerList from '../components/PeerList';
import type { PeerStatus } from '@shared/types';
import { getPeers, getNodeStatus } from '../api';
import type { NodeStatus } from '../api';

export default function PeersPage(): JSX.Element {
  const [peers, setPeers] = useState<PeerStatus[]>([]);
  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);

  useEffect(() => {
    getPeers().then(setPeers).catch(() => {});
    getNodeStatus().then(setNodeStatus).catch(() => {});
    const interval = setInterval(() => {
      getPeers().then(setPeers).catch(() => {});
      getNodeStatus().then(setNodeStatus).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-4">
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Node Info</h2>
        {nodeStatus ? (
          <div className="space-y-1 text-sm">
            <p><span className="text-slate-400">Node ID:</span> {nodeStatus.nodeId ?? 'N/A'}</p>
            <p><span className="text-slate-400">Status:</span>{' '}
              <span className={nodeStatus.online ? 'text-emerald-400' : 'text-rose-400'}>
                {nodeStatus.online ? 'Online' : 'Offline'}
              </span>
            </p>
            {nodeStatus.addresses.length > 0 && (
              <div>
                <p className="text-slate-400">Listen Addresses:</p>
                <ul className="ml-2 text-xs text-slate-300">
                  {nodeStatus.addresses.map((addr) => (
                    <li key={addr}>{addr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </Panel>
      <Panel>
        <h2 className="mb-3 text-lg font-semibold">Connected Peers ({peers.length})</h2>
        <PeerList peers={peers} />
      </Panel>
    </div>
  );
}
