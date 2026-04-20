import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { DatabaseManager } from '../src/database/Database';
import { WalletManager } from '../src/wallet/WalletManager';
import { P2PNode } from '../src/network/P2PNode';
import { DistributedOrderBook } from '../src/engine/OrderBook';
import { MatchingEngine } from '../src/engine/MatchingEngine';
import { SwapEngine } from '../src/engine/SwapEngine';
import { CFVClient } from '../src/cfv/CFVClient';
import { CFVPriceGuard } from '../src/cfv/CFVPriceGuard';
import { PeerManager } from '../src/network/PeerManager';
import { createRouter } from './routes';
import { setupWebSocket, broadcast } from './ws';
import { NetworkService } from './NetworkService';

const PORT = Number(process.env.PORT) || 3000;
const CFV_URL = process.env.CFV_URL || 'http://localhost:3001';

const app = express();
app.use(cors());
app.use(express.json());

// ── Core services ──────────────────────────────────────────────────
const db = new DatabaseManager();
const p2pNode = new P2PNode();
const orderBook = new DistributedOrderBook();
const matchingEngine = new MatchingEngine();
const swapEngine = new SwapEngine();
const walletManager = new WalletManager();
const cfvClient = new CFVClient(CFV_URL);
const cfvGuard = new CFVPriceGuard();
const peerManager = new PeerManager();

// ── HTTP server + WebSocket ────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

// ── Network service (P2P ↔ application wiring) ────────────────────
const networkService = new NetworkService(
  p2pNode,
  orderBook,
  matchingEngine,
  swapEngine,
  peerManager,
  db,
  (event: string, data: unknown) => broadcast(wss, event, data)
);

// ── REST API routes ────────────────────────────────────────────────
const router = createRouter({
  db,
  orderBook,
  matchingEngine,
  swapEngine,
  walletManager,
  cfvClient,
  cfvGuard,
  peerManager,
  p2pNode,
  networkService,
  broadcast: (event: string, data: unknown) => broadcast(wss, event, data),
});
app.use('/api', router);

// ── Serve static frontend in production ────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Periodic tasks ─────────────────────────────────────────────────
// Cleanup expired orders every 60 seconds
setInterval(() => {
  orderBook.cleanupExpiredOrders();
}, 60_000);

// Check for expired swaps every 30 seconds
setInterval(() => {
  const initiated = db.findSwapsByState('INITIATED');
  const accepted = db.findSwapsByState('ACCEPTED');
  const allActive = [...initiated, ...accepted];
  const now = Date.now();
  for (const swap of allActive) {
    if (now >= swap.expiresAt) {
      try {
        const updated = swapEngine.refundSwap(swap.id);
        db.updateSwapState(swap.id, updated.state);
        // Mark associated trade as failed
        const trades = db.findAllTrades().filter(
          (t) => t.status === 'pending'
        );
        for (const trade of trades) {
          if (trade.buyOrderId === swap.orderId || trade.sellOrderId === swap.orderId) {
            db.updateTradeStatus(trade.id, 'failed');
          }
        }
        // Adjust peer reputation
        peerManager.adjustReputation(swap.counterparty, -0.1);
        broadcast(wss, 'swap:expired', { swapId: swap.id });
      } catch {
        // Swap may already be completed
      }
    }
  }
}, 30_000);

// Refresh CFV cache every 5 minutes
setInterval(async () => {
  try {
    const metrics = await cfvClient.getAllCoinMetrics();
    for (const m of metrics) {
      db.upsertCFVCache({
        symbol: m.symbol,
        fairValue: m.fairValue,
        marketPrice: m.marketPrice,
        valuationStatus: m.valuationStatus,
        updatedAt: Date.now(),
      });
    }
    broadcast(wss, 'cfv:updated', metrics);
  } catch {
    // CFV agent may be unavailable
  }
}, 5 * 60_000);

// ── Start server ───────────────────────────────────────────────────
async function start(): Promise<void> {
  try {
    await p2pNode.start();
    networkService.setup();
    console.log('P2P node started');
  } catch (err) {
    console.warn('P2P node failed to start (running without P2P):', err);
  }

  server.listen(PORT, () => {
    console.log(`CFVDEX server running at http://localhost:${PORT}`);
  });
}

function shutdown(): void {
  console.log('Shutting down...');
  p2pNode.stop().catch(() => {});
  db.close();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
