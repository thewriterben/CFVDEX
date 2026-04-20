import type { PeerStatus } from '@shared/types';

export class PeerManager {
  private readonly peers = new Map<string, PeerStatus>();

  upsertPeer(id: string, connected: boolean): void {
    const current = this.peers.get(id);
    this.peers.set(id, {
      id,
      status: connected ? 'connected' : 'disconnected',
      reputation: current?.reputation ?? 0.5,
      lastSeen: Date.now()
    });
  }

  adjustReputation(id: string, delta: number): void {
    const current = this.peers.get(id);
    if (!current) {
      return;
    }

    this.peers.set(id, {
      ...current,
      reputation: Math.max(0, Math.min(1, current.reputation + delta))
    });
  }

  list(): PeerStatus[] {
    return [...this.peers.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  }
}
