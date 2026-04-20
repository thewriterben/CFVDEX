import Database from 'better-sqlite3';
import type { Order, Trade, SwapRecord, PeerStatus } from '@shared/types';

export interface WalletRow {
  symbol: string;
  address: string;
  encryptedMetadata: string;
  updatedAt: number;
}

export interface CFVCacheRow {
  symbol: string;
  fairValue: number;
  marketPrice: number;
  valuationStatus: string;
  updatedAt: number;
}

export interface SettingRow {
  key: string;
  value: string;
  updatedAt: number;
}

export class DatabaseManager {
  private readonly db: Database.Database;

  constructor(path = 'cfvdex.db') {
    this.db = new Database(path);
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        maker_peer_id TEXT NOT NULL,
        pair TEXT NOT NULL,
        side TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        ttl INTEGER NOT NULL,
        signature TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        buy_order_id TEXT NOT NULL,
        sell_order_id TEXT NOT NULL,
        pair TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS swaps (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        counterparty TEXT NOT NULL,
        state TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        secret TEXT,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS peers (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        reputation REAL NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wallets (
        symbol TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        encrypted_metadata TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cfv_cache (
        symbol TEXT PRIMARY KEY,
        fair_value REAL NOT NULL,
        market_price REAL NOT NULL,
        valuation_status TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  // ── Orders ──────────────────────────────────────────────────────────

  insertOrder(order: Order): void {
    this.db
      .prepare(
        `INSERT INTO orders (id, maker_peer_id, pair, side, price, amount, timestamp, ttl, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        order.id,
        order.makerPeerId,
        order.pair,
        order.side,
        order.price,
        order.amount,
        order.timestamp,
        order.ttl,
        order.signature
      );
  }

  updateOrder(order: Order): void {
    this.db
      .prepare(
        `UPDATE orders
         SET maker_peer_id = ?, pair = ?, side = ?, price = ?, amount = ?,
             timestamp = ?, ttl = ?, signature = ?
         WHERE id = ?`
      )
      .run(
        order.makerPeerId,
        order.pair,
        order.side,
        order.price,
        order.amount,
        order.timestamp,
        order.ttl,
        order.signature,
        order.id
      );
  }

  deleteOrder(id: string): void {
    this.db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }

  findOrderById(id: string): Order | undefined {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapOrder(row) : undefined;
  }

  findAllOrders(): Order[] {
    const rows = this.db.prepare('SELECT * FROM orders').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapOrder(r));
  }

  findOrdersByPair(pair: string): Order[] {
    const rows = this.db
      .prepare('SELECT * FROM orders WHERE pair = ?')
      .all(pair) as Record<string, unknown>[];
    return rows.map((r) => this.mapOrder(r));
  }

  private mapOrder(row: Record<string, unknown>): Order {
    return {
      id: row.id as string,
      makerPeerId: row.maker_peer_id as string,
      pair: row.pair as string,
      side: row.side as Order['side'],
      price: row.price as number,
      amount: row.amount as number,
      timestamp: row.timestamp as number,
      ttl: row.ttl as number,
      signature: row.signature as string,
    };
  }

  // ── Trades ──────────────────────────────────────────────────────────

  insertTrade(trade: Trade): void {
    this.db
      .prepare(
        `INSERT INTO trades (id, buy_order_id, sell_order_id, pair, price, amount, status, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        trade.id,
        trade.buyOrderId,
        trade.sellOrderId,
        trade.pair,
        trade.price,
        trade.amount,
        trade.status,
        trade.timestamp
      );
  }

  updateTradeStatus(id: string, status: Trade['status']): void {
    this.db.prepare('UPDATE trades SET status = ? WHERE id = ?').run(status, id);
  }

  findTradeById(id: string): Trade | undefined {
    const row = this.db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapTrade(row) : undefined;
  }

  findAllTrades(): Trade[] {
    const rows = this.db.prepare('SELECT * FROM trades').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapTrade(r));
  }

  findTradesByPair(pair: string): Trade[] {
    const rows = this.db
      .prepare('SELECT * FROM trades WHERE pair = ?')
      .all(pair) as Record<string, unknown>[];
    return rows.map((r) => this.mapTrade(r));
  }

  private mapTrade(row: Record<string, unknown>): Trade {
    return {
      id: row.id as string,
      buyOrderId: row.buy_order_id as string,
      sellOrderId: row.sell_order_id as string,
      pair: row.pair as string,
      price: row.price as number,
      amount: row.amount as number,
      status: row.status as Trade['status'],
      timestamp: row.timestamp as number,
    };
  }

  // ── Swaps ───────────────────────────────────────────────────────────

  insertSwap(swap: SwapRecord): void {
    this.db
      .prepare(
        `INSERT INTO swaps (id, order_id, counterparty, state, secret_hash, secret, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        swap.id,
        swap.orderId,
        swap.counterparty,
        swap.state,
        swap.secretHash,
        swap.secret ?? null,
        swap.expiresAt
      );
  }

  updateSwapState(id: string, state: SwapRecord['state'], secret?: string): void {
    this.db
      .prepare('UPDATE swaps SET state = ?, secret = COALESCE(?, secret) WHERE id = ?')
      .run(state, secret ?? null, id);
  }

  findSwapById(id: string): SwapRecord | undefined {
    const row = this.db.prepare('SELECT * FROM swaps WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapSwap(row) : undefined;
  }

  findAllSwaps(): SwapRecord[] {
    const rows = this.db.prepare('SELECT * FROM swaps').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapSwap(r));
  }

  findSwapsByState(state: SwapRecord['state']): SwapRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM swaps WHERE state = ?')
      .all(state) as Record<string, unknown>[];
    return rows.map((r) => this.mapSwap(r));
  }

  private mapSwap(row: Record<string, unknown>): SwapRecord {
    return {
      id: row.id as string,
      orderId: row.order_id as string,
      counterparty: row.counterparty as string,
      state: row.state as SwapRecord['state'],
      secretHash: row.secret_hash as string,
      secret: (row.secret as string) ?? undefined,
      expiresAt: row.expires_at as number,
    };
  }

  // ── Peers ───────────────────────────────────────────────────────────

  upsertPeer(peer: PeerStatus): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO peers (id, status, reputation, last_seen)
         VALUES (?, ?, ?, ?)`
      )
      .run(peer.id, peer.status, peer.reputation, peer.lastSeen);
  }

  findPeerById(id: string): PeerStatus | undefined {
    const row = this.db.prepare('SELECT * FROM peers WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapPeer(row) : undefined;
  }

  findAllPeers(): PeerStatus[] {
    const rows = this.db.prepare('SELECT * FROM peers').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapPeer(r));
  }

  private mapPeer(row: Record<string, unknown>): PeerStatus {
    return {
      id: row.id as string,
      status: row.status as PeerStatus['status'],
      reputation: row.reputation as number,
      lastSeen: row.last_seen as number,
    };
  }

  // ── Wallets ─────────────────────────────────────────────────────────

  upsertWallet(wallet: WalletRow): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO wallets (symbol, address, encrypted_metadata, updated_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(wallet.symbol, wallet.address, wallet.encryptedMetadata, wallet.updatedAt);
  }

  findWalletBySymbol(symbol: string): WalletRow | undefined {
    const row = this.db.prepare('SELECT * FROM wallets WHERE symbol = ?').get(symbol) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapWallet(row) : undefined;
  }

  findAllWallets(): WalletRow[] {
    const rows = this.db.prepare('SELECT * FROM wallets').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapWallet(r));
  }

  private mapWallet(row: Record<string, unknown>): WalletRow {
    return {
      symbol: row.symbol as string,
      address: row.address as string,
      encryptedMetadata: row.encrypted_metadata as string,
      updatedAt: row.updated_at as number,
    };
  }

  // ── CFV Cache ───────────────────────────────────────────────────────

  upsertCFVCache(entry: CFVCacheRow): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO cfv_cache (symbol, fair_value, market_price, valuation_status, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        entry.symbol,
        entry.fairValue,
        entry.marketPrice,
        entry.valuationStatus,
        entry.updatedAt
      );
  }

  findCFVCacheBySymbol(symbol: string): CFVCacheRow | undefined {
    const row = this.db.prepare('SELECT * FROM cfv_cache WHERE symbol = ?').get(symbol) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapCFVCache(row) : undefined;
  }

  findAllCFVCache(): CFVCacheRow[] {
    const rows = this.db.prepare('SELECT * FROM cfv_cache').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapCFVCache(r));
  }

  private mapCFVCache(row: Record<string, unknown>): CFVCacheRow {
    return {
      symbol: row.symbol as string,
      fairValue: row.fair_value as number,
      marketPrice: row.market_price as number,
      valuationStatus: row.valuation_status as string,
      updatedAt: row.updated_at as number,
    };
  }

  // ── Settings ────────────────────────────────────────────────────────

  setSetting(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)`
      )
      .run(key, value, Date.now());
  }

  getSetting(key: string): SettingRow | undefined {
    const row = this.db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapSetting(row) : undefined;
  }

  getAllSettings(): SettingRow[] {
    const rows = this.db.prepare('SELECT * FROM settings').all() as Record<string, unknown>[];
    return rows.map((r) => this.mapSetting(r));
  }

  private mapSetting(row: Record<string, unknown>): SettingRow {
    return {
      key: row.key as string,
      value: row.value as string,
      updatedAt: row.updated_at as number,
    };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────

  close(): void {
    this.db.close();
  }
}
