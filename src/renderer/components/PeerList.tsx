import type { PeerStatus } from '@shared/types';

interface PeerListProps {
  peers: PeerStatus[];
}

export default function PeerList({ peers }: PeerListProps): JSX.Element {
  return (
    <ul className="space-y-2">
      {peers.map((peer) => (
        <li key={peer.id} className="rounded border border-slate-700 bg-slate-900 p-3">
          <div className="flex justify-between">
            <span>{peer.id.slice(0, 16)}</span>
            <span className={peer.status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}>{peer.status}</span>
          </div>
          <p className="text-xs text-slate-400">Reputation: {peer.reputation.toFixed(2)}</p>
        </li>
      ))}
    </ul>
  );
}
