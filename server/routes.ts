import { Router } from 'express';
import type { DatabaseManager } from '../src/database/Database';
import type { DistributedOrderBook } from '../src/engine/OrderBook';
import type { MatchingEngine } from '../src/engine/MatchingEngine';
import type { SwapEngine } from '../src/engine/SwapEngine';
import type { WalletManager } from '../src/wallet/WalletManager';
import type { CFVClient } from '../src/cfv/CFVClient';
import type { CFVPriceGuard } from '../src/cfv/CFVPriceGuard';
import type { PeerManager } from '../src/network/PeerManager';
import type { P2PNode } from '../src/network/P2PNode';
import type { NetworkService } from './NetworkService';
import { DGF_COINS, getPairs } from '../src/shared/constants';
import type { CoinSymbol } from '../src/shared/constants';

interface RouterDeps {
  db: DatabaseManager;
  orderBook: DistributedOrderBook;
  matchingEngine: MatchingEngine;
  swapEngine: SwapEngine;
  walletManager: WalletManager;
  cfvClient: CFVClient;
  cfvGuard: CFVPriceGuard;
  peerManager: PeerManager;
  p2pNode: P2PNode;
  networkService: NetworkService;
  broadcast: (event: string, data: unknown) => void;
}

export function createRouter(deps: RouterDeps): Router {
  const {
    db,
    orderBook,
    matchingEngine,
    swapEngine,
    walletManager,
    cfvClient,
    cfvGuard,
    peerManager,
    networkService,
    broadcast,
  } = deps;

  const router = Router();

  // ── Orders ──────────────────────────────────────────────────────────

  router.post('/orders', (req, res) => {
    try {
      const { pair, side, price, amount } = req.body;

      // Input validation
      if (!pair || !side || price == null || amount == null) {
        res.status(400).json({ error: 'Missing required fields: pair, side, price, amount' });
        return;
      }
      if (!['buy', 'sell'].includes(side)) {
        res.status(400).json({ error: 'Side must be "buy" or "sell"' });
        return;
      }
      if (typeof price !== 'number' || price <= 0) {
        res.status(400).json({ error: 'Price must be a positive number' });
        return;
      }
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }
      const validPairs = getPairs();
      if (!validPairs.includes(pair)) {
        res.status(400).json({ error: `Invalid pair. Must be one of: ${validPairs.slice(0, 5).join(', ')}...` });
        return;
      }

      // CFV price guard check
      const [base] = pair.split('/');
      const cached = db.findCFVCacheBySymbol(base);
      let cfvWarning: string | undefined;
      if (cached && cfvGuard.isSuspicious(price, cached.fairValue)) {
        cfvWarning = `Price deviates more than 20% from CFV fair value (${cached.fairValue})`;
      }

      const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nodeId = networkService.getNodeId() || 'local-node';
      const order = {
        id,
        makerPeerId: nodeId,
        pair,
        side: side as 'buy' | 'sell',
        price,
        amount,
        timestamp: Date.now(),
        ttl: 10 * 60 * 1000,
        signature: 'local-signature',
      };

      // Add to CRDT + persist + trigger matching
      networkService.handleIncomingOrder(order);

      res.json({ id, cfvWarning });
    } catch (err) {
      res.status(500).json({ error: 'Failed to place order' });
    }
  });

  router.delete('/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      networkService.handleOrderCancel(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  });

  router.get('/orders', (req, res) => {
    try {
      const pair = req.query.pair as string | undefined;
      const orders = orderBook.listOrders(pair);
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // ── Trades ──────────────────────────────────────────────────────────

  router.get('/trades', (req, res) => {
    try {
      const pair = req.query.pair as string | undefined;
      const status = req.query.status as string | undefined;
      let trades = pair ? db.findTradesByPair(pair) : db.findAllTrades();
      if (status) {
        trades = trades.filter((t) => t.status === status);
      }
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  router.get('/trades/:id', (req, res) => {
    try {
      const trade = db.findTradeById(req.params.id);
      if (!trade) {
        res.status(404).json({ error: 'Trade not found' });
        return;
      }
      res.json(trade);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch trade' });
    }
  });

  // ── Swaps ───────────────────────────────────────────────────────────

  router.get('/swaps', (req, res) => {
    try {
      const state = req.query.state as string | undefined;
      const swaps = state
        ? db.findSwapsByState(state as any)
        : db.findAllSwaps();
      res.json(swaps);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch swaps' });
    }
  });

  router.get('/swaps/:id', (req, res) => {
    try {
      const swap = swapEngine.getSwap(req.params.id) ?? db.findSwapById(req.params.id);
      if (!swap) {
        res.status(404).json({ error: 'Swap not found' });
        return;
      }
      res.json(swap);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch swap' });
    }
  });

  // ── Wallets ─────────────────────────────────────────────────────────

  router.get('/wallets/balances', async (_req, res) => {
    try {
      const balances = await walletManager.getAllBalances();
      res.json(balances);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch balances' });
    }
  });

  router.get('/wallets/:symbol/address', async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      if (!DGF_COINS.includes(symbol as CoinSymbol)) {
        res.status(400).json({ error: `Invalid coin symbol: ${symbol}` });
        return;
      }
      const wallet = walletManager.getWallet(symbol);
      const address = await wallet.generateAddress();
      res.json({ symbol, address });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate address' });
    }
  });

  // ── Peers ───────────────────────────────────────────────────────────

  router.get('/peers', (_req, res) => {
    try {
      const peers = peerManager.list();
      res.json(peers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch peers' });
    }
  });

  // ── CFV ─────────────────────────────────────────────────────────────

  router.get('/cfv/metrics', async (_req, res) => {
    try {
      // Try cache first
      const cached = db.findAllCFVCache();
      if (cached.length > 0) {
        res.json(cached);
        return;
      }
      // Fall back to live fetch
      const metrics = await cfvClient.getAllCoinMetrics();
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch CFV metrics' });
    }
  });

  router.get('/cfv/metrics/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase() as CoinSymbol;
      // Try cache first
      const cached = db.findCFVCacheBySymbol(symbol);
      if (cached) {
        res.json(cached);
        return;
      }
      const fairValue = await cfvClient.getFairValue(symbol);
      res.json({ symbol, fairValue });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch CFV price' });
    }
  });

  // ── Node Status ─────────────────────────────────────────────────────

  router.get('/node/status', (_req, res) => {
    try {
      const nodeId = networkService.getNodeId();
      const addresses = networkService.getListenAddresses();
      const peers = peerManager.list();
      res.json({
        nodeId,
        peerCount: peers.filter((p) => p.status === 'connected').length,
        totalPeers: peers.length,
        addresses,
        online: nodeId !== null,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch node status' });
    }
  });

  // ── Settings ────────────────────────────────────────────────────────

  router.get('/settings', (_req, res) => {
    try {
      const settings = db.getAllSettings();
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  router.put('/settings', (req, res) => {
    try {
      const entries = req.body;
      if (!entries || typeof entries !== 'object') {
        res.status(400).json({ error: 'Body must be a key-value object' });
        return;
      }
      for (const [key, value] of Object.entries(entries)) {
        if (typeof value === 'string') {
          db.setSetting(key, value);
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // ── Constants ───────────────────────────────────────────────────────

  router.get('/coins', (_req, res) => {
    res.json(DGF_COINS);
  });

  router.get('/pairs', (_req, res) => {
    res.json(getPairs());
  });

  return router;
}
