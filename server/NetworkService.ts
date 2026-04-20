import type { P2PNode } from '../src/network/P2PNode';
import type { DistributedOrderBook } from '../src/engine/OrderBook';
import type { MatchingEngine } from '../src/engine/MatchingEngine';
import type { SwapEngine } from '../src/engine/SwapEngine';
import type { PeerManager } from '../src/network/PeerManager';
import type { DatabaseManager } from '../src/database/Database';
import { ORDER_TOPIC, CANCEL_TOPIC } from '../src/network/OrderProtocol';
import { SWAP_PROTOCOL_ID } from '../src/network/SwapProtocol';
import type { Order } from '../src/shared/types';
import type { SwapMessage } from '../src/network/SwapProtocol';

export class NetworkService {
  constructor(
    private readonly p2pNode: P2PNode,
    private readonly orderBook: DistributedOrderBook,
    private readonly matchingEngine: MatchingEngine,
    private readonly swapEngine: SwapEngine,
    private readonly peerManager: PeerManager,
    private readonly db: DatabaseManager,
    private readonly broadcastFn: (event: string, data: unknown) => void
  ) {}

  setup(): void {
    const node = this.p2pNode.getNode();
    if (!node) return;

    this.subscribeToPubsub(node);
    this.listenForPeerEvents(node);
    this.registerSwapHandler(node);
  }

  private subscribeToPubsub(node: any): void {
    const pubsub = node.services?.pubsub;
    if (!pubsub) return;

    // Subscribe to order topic
    pubsub.subscribe(ORDER_TOPIC);
    pubsub.subscribe(CANCEL_TOPIC);

    pubsub.addEventListener('message', (event: any) => {
      try {
        const topic = event.detail?.topic;
        const data = new TextDecoder().decode(event.detail?.data);

        if (topic === ORDER_TOPIC) {
          const order = JSON.parse(data) as Order;
          this.handleIncomingOrder(order);
        } else if (topic === CANCEL_TOPIC) {
          const { orderId } = JSON.parse(data) as { orderId: string };
          this.handleOrderCancel(orderId);
        }
      } catch {
        // Ignore malformed messages
      }
    });
  }

  private listenForPeerEvents(node: any): void {
    node.addEventListener('peer:connect', (event: any) => {
      try {
        const peerId = event.detail?.toString() ?? event.detail?.remotePeer?.toString();
        if (peerId) {
          this.peerManager.upsertPeer(peerId, true);
          this.db.upsertPeer({
            id: peerId,
            status: 'connected',
            reputation: 0.5,
            lastSeen: Date.now(),
          });
          this.broadcastFn('peer:connected', { id: peerId });
        }
      } catch {
        // Ignore
      }
    });

    node.addEventListener('peer:disconnect', (event: any) => {
      try {
        const peerId = event.detail?.toString() ?? event.detail?.remotePeer?.toString();
        if (peerId) {
          this.peerManager.upsertPeer(peerId, false);
          this.db.upsertPeer({
            id: peerId,
            status: 'disconnected',
            reputation: this.peerManager.list().find((p) => p.id === peerId)?.reputation ?? 0.5,
            lastSeen: Date.now(),
          });
          this.broadcastFn('peer:disconnected', { id: peerId });
        }
      } catch {
        // Ignore
      }
    });
  }

  private registerSwapHandler(node: any): void {
    try {
      node.handle(SWAP_PROTOCOL_ID, async ({ stream }: { stream: any }) => {
        let raw = '';
        for await (const chunk of stream.source) {
          raw += new TextDecoder().decode(chunk.subarray ? chunk.subarray() : chunk);
        }
        const message = JSON.parse(raw) as SwapMessage;
        this.handleSwapMessage(message);
      });
    } catch {
      // Protocol may already be registered
    }
  }

  handleIncomingOrder(order: Order): void {
    // Add to CRDT order book
    this.orderBook.addOrder(order);

    // Persist to database
    try {
      this.db.insertOrder(order);
    } catch {
      // May already exist
    }

    // Trigger matching
    const orders = this.orderBook.listOrders(order.pair);
    const matches = this.matchingEngine.match(orders);

    for (const match of matches) {
      const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const trade = {
        id: tradeId,
        buyOrderId: match.buyOrder.id,
        sellOrderId: match.sellOrder.id,
        pair: match.buyOrder.pair,
        price: match.price,
        amount: match.amount,
        status: 'pending' as const,
        timestamp: Date.now(),
      };
      this.db.insertTrade(trade);

      // Initiate swap
      const swap = this.swapEngine.initiateSwap(match.buyOrder, match.sellOrder.makerPeerId);
      this.db.insertSwap(swap);

      this.broadcastFn('trade:matched', trade);
      this.broadcastFn('swap:initiated', { swapId: swap.id, tradeId });
    }

    this.broadcastFn('orderbook:updated', { pair: order.pair });
  }

  handleOrderCancel(orderId: string): void {
    this.orderBook.cancelOrder(orderId);
    this.db.deleteOrder(orderId);
    this.broadcastFn('order:cancelled', { orderId });
  }

  private handleSwapMessage(message: SwapMessage): void {
    try {
      switch (message.type) {
        case 'ACCEPT': {
          const swap = this.swapEngine.acceptSwap(message.swapId);
          this.db.updateSwapState(swap.id, swap.state);
          this.broadcastFn('swap:accepted', { swapId: swap.id });
          break;
        }
        case 'REVEAL': {
          const secret = message.payload.secret as string;
          const swap = this.swapEngine.completeSwap(message.swapId, secret);
          this.db.updateSwapState(swap.id, swap.state, secret);
          this.broadcastFn('swap:completed', { swapId: swap.id });
          break;
        }
        case 'CLAIM': {
          // Final settlement — update trade status
          this.broadcastFn('swap:claimed', { swapId: message.swapId });
          break;
        }
        default:
          break;
      }
    } catch {
      // Invalid swap state transition
    }
  }

  getNodeId(): string | null {
    const node = this.p2pNode.getNode();
    return node?.peerId?.toString() ?? null;
  }

  getListenAddresses(): string[] {
    const node = this.p2pNode.getNode();
    if (!node) return [];
    try {
      return node.getMultiaddrs?.()?.map((ma: any) => ma.toString()) ?? [];
    } catch {
      return [];
    }
  }
}
