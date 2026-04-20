# CFVDEX

CFVDEX is a decentralized peer-to-peer exchange for the 12 Digital Gold Foundation (DGF) coins, built as a web application with a Node.js backend and React frontend.

## Supported DGF Coins

- DigiByte (DGB)
- DASH
- Monero (XMR)
- Nano (XNO)
- ZClassic (ZCL)
- Ravencoin (RVN)
- eCash (XEC)
- MultiversX (EGLD)
- NEAR Protocol (NEAR)
- Internet Computer (ICP)
- Chia (XCH)
- Digital Gold (DGD)

Reference: <https://www.digitalgoldfoundation.org/reports>

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     Web Application                       │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │            React Frontend (Vite + Tailwind)          ││
│  │  Dashboard │ Trade │ Wallet │ History │ Peers │ Settings│
│  └────────────────────────┬─────────────────────────────┘│
│                REST API + WebSocket                       │
│  ┌────────────────────────┴─────────────────────────────┐│
│  │           Express + Node.js Backend Server           ││
│  │                                                      ││
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │ Trade Engine│  │ Swap Engine  │  │Wallet Manager│ ││
│  │  └─────┬──────┘  └──────┬───────┘  └──────┬───────┘ ││
│  │        └────────────┬────┴─────────────────┘         ││
│  │                     v                                 ││
│  │  ┌──────────────────────────────────────────────────┐││
│  │  │             P2P Network Layer (libp2p)           │││
│  │  └──────────────────────┬───────────────────────────┘││
│  │                         │                             ││
│  │  ┌──────────────────────┴───────────────────────────┐││
│  │  │              Local Data Store (SQLite)            │││
│  │  └──────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## P2P Network

- Peer discovery: KadDHT + mDNS + bootstrap peers
- Broadcast: gossipsub order and cancel topics
- Swap negotiation: direct stream protocol `/cfvdex/swap/1.0.0`
- Every running server instance is a node

## Atomic Swaps (HTLC Flow)

```text
INITIATED -> ACCEPTED -> COMPLETED
                    \-> REFUNDED
                    \-> EXPIRED
```

`SwapEngine` includes lifecycle methods for initiation, acceptance, completion, and refund behavior.

## CFV Integration

- `src/cfv/CFVClient.ts` connects to `cfv-metrics-agent`
- Default URL: `http://localhost:3001`
- `CFVPriceGuard` flags trades deviating more than 20% from fair value

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place a new order |
| DELETE | `/api/orders/:id` | Cancel an order |
| GET | `/api/orders?pair=DGB/DASH` | Get order book (optional pair filter) |
| GET | `/api/trades` | Get trade history |
| GET | `/api/swaps` | Get swap records |
| GET | `/api/wallets/balances` | Get all wallet balances |
| GET | `/api/wallets/:symbol/address` | Generate a deposit address |
| GET | `/api/peers` | List connected peers |
| GET | `/api/node/status` | Get node status |
| GET | `/api/cfv/metrics` | Get CFV fair-value metrics |
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Save app settings |
| GET | `/api/coins` | List supported coins |
| GET | `/api/pairs` | List all trading pairs |

## WebSocket Events

Real-time push events via WebSocket:

- `orderbook:updated` — new order arrived
- `trade:matched` — orders were matched
- `swap:initiated` / `swap:accepted` / `swap:completed` / `swap:expired`
- `peer:connected` / `peer:disconnected`
- `cfv:updated` — CFV metrics refreshed

## Project Structure

- `server/` — Express backend, REST routes, WebSocket, NetworkService
- `src/renderer/` — React UI (Dashboard, Trade, Wallet, History, Peers, Settings)
- `src/renderer/api.ts` — Frontend API client
- `src/network/` — libp2p node + protocols
- `src/engine/` — distributed order book, matching engine, swap engine
- `src/wallet/` — wallet manager, keystore, and 12 coin adapter stubs
- `src/cfv/` — CFV API client and guard logic
- `src/database/` — SQLite schema + CRUD operations
- `tests/` — Vitest unit tests

## Quick Start

```bash
npm install

# Development (frontend only with API proxy)
npm run dev

# Development (frontend + backend together)
npm run dev:full

# Or run server separately
npm run dev:server
```

The frontend runs on `http://localhost:5173` with API calls proxied to the backend on `http://localhost:3000`.

## Build & Deploy

```bash
# Build both frontend and server
npm run build

# Start production server (serves frontend + API)
npm start
```

The production server serves the built React app and API on a single port (default 3000).

## Testing

```bash
npm test
```

54 unit tests covering: MatchingEngine, SwapEngine, CFVPriceGuard, KeyStore, OrderBook, PeerManager, DatabaseManager, and constants.

## Configuration

- `PORT` env var: server port (default 3000)
- `CFV_URL` env var: CFV metrics agent URL (default `http://localhost:3001`)
- Bootstrap peers: configurable in `P2PNode` and via Settings page
- CFV agent URL: configurable via Settings page

## Contributing

1. Create a branch
2. Keep changes scoped and typed
3. Run `npm run typecheck && npm test`
4. Open a PR with a clear summary
