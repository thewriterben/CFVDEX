import Database from 'better-sqlite3';

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

  close(): void {
    this.db.close();
  }
}
