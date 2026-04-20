import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { mdns } from '@libp2p/mdns';
import { bootstrap } from '@libp2p/bootstrap';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { kadDHT } from '@libp2p/kad-dht';

export class P2PNode {
  private node?: any;

  constructor(private readonly bootstrapPeers: string[] = []) {}

  async start(): Promise<void> {
    const create = createLibp2p as any;
    this.node = await create({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0', '/ip4/0.0.0.0/tcp/0/ws']
      },
      transports: [tcp(), webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [yamux()],
      peerDiscovery: [mdns(), bootstrap({ list: this.bootstrapPeers })],
      services: {
        pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
        dht: kadDHT({ clientMode: false })
      }
    });

    await this.node.start();
  }

  async stop(): Promise<void> {
    if (this.node) {
      await this.node.stop();
      this.node = undefined;
    }
  }

  getNode(): any | undefined {
    return this.node;
  }
}
