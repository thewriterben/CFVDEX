import Panel from '../components/Panel';
import PeerList from '../components/PeerList';
import type { PeerStatus } from '@shared/types';

const peers: PeerStatus[] = [
  {
    id: '12D3KooWCFVDEXPeerExample',
    status: 'connected',
    reputation: 0.95,
    lastSeen: Date.now()
  }
];

export default function PeersPage(): JSX.Element {
  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">Connected Peers</h2>
      <PeerList peers={peers} />
    </Panel>
  );
}
