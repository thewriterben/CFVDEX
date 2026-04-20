import { describe, it, expect, beforeEach } from 'vitest';
import { PeerManager } from '../src/network/PeerManager';

describe('PeerManager', () => {
  let pm: PeerManager;

  beforeEach(() => {
    pm = new PeerManager();
  });

  it('upsertPeer adds a new peer', () => {
    pm.upsertPeer('peer-1', true);

    const peers = pm.list();
    expect(peers).toHaveLength(1);
    expect(peers[0].id).toBe('peer-1');
    expect(peers[0].status).toBe('connected');
    expect(peers[0].reputation).toBe(0.5);
  });

  it('upsertPeer updates existing peer', () => {
    pm.upsertPeer('peer-1', true);
    pm.upsertPeer('peer-1', false);

    const peers = pm.list();
    expect(peers).toHaveLength(1);
    expect(peers[0].status).toBe('disconnected');
    expect(peers[0].reputation).toBe(0.5);
  });

  it('adjustReputation changes reputation', () => {
    pm.upsertPeer('peer-1', true);
    pm.adjustReputation('peer-1', 0.2);

    const peers = pm.list();
    expect(peers[0].reputation).toBeCloseTo(0.7);
  });

  it('reputation clamped to [0, 1]', () => {
    pm.upsertPeer('peer-1', true);

    pm.adjustReputation('peer-1', 2.0);
    expect(pm.list()[0].reputation).toBe(1);

    pm.adjustReputation('peer-1', -5.0);
    expect(pm.list()[0].reputation).toBe(0);
  });

  it('list returns peers sorted by lastSeen descending', async () => {
    pm.upsertPeer('old-peer', true);
    // Small delay to ensure different lastSeen timestamps
    await new Promise((r) => setTimeout(r, 10));
    pm.upsertPeer('new-peer', true);

    const peers = pm.list();
    expect(peers).toHaveLength(2);
    expect(peers[0].id).toBe('new-peer');
    expect(peers[1].id).toBe('old-peer');
  });
});
