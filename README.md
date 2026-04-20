# CFVDEX

CFVDEX is a downloadable decentralized peer-to-peer exchange scaffold for the 12 Digital Gold Foundation (DGF) coins.

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
│                   Electron Desktop App                    │
│                                                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  React UI  │  │ Trade Engine │  │  Wallet Manager  │ │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘ │
│        └────────────┬────┴───────────────────┘           │
│                     v                                     │
│  ┌──────────────────────────────────────────────────────┐│
│  │             P2P Network Layer (libp2p)              ││
│  └──────────────────────┬───────────────────────────────┘│
│                         │                                 │
│  ┌──────────────────────┴───────────────────────────────┐│
│  │              Local Data Store (SQLite)               ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## P2P Network

- Peer discovery: KadDHT + mDNS + bootstrap peers
- Broadcast: gossipsub order and cancel topics
- Swap negotiation: direct stream protocol `/cfvdex/swap/1.0.0`
- Every running app instance is a node

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

## Project Structure

- `electron/` main and preload processes
- `src/renderer/` React UI (Dashboard, Trade, Wallet, History, Peers, Settings)
- `src/network/` libp2p node + protocols
- `src/engine/` distributed order book, matching engine, swap engine
- `src/wallet/` wallet manager, keystore, and 12 coin adapter stubs
- `src/cfv/` CFV API client and guard logic
- `src/database/` SQLite schema bootstrap

## Quick Start

```bash
npm install
npm run dev
```

## Build & Package

```bash
npm run build
npm run package
```

Packaging targets via `electron-builder`:

- Windows: NSIS `.exe`
- macOS: `.dmg`
- Linux: `.AppImage` and `.deb`

## Configuration

- Auto-start at OS login: configured via `auto-launch` in `electron/main.ts`
- Bootstrap peers: configurable in `P2PNode`
- CFV agent URL: configurable in `CFVClient`

## Contributing

1. Create a branch
2. Keep changes scoped and typed
3. Run lint/typecheck/build
4. Open a PR with a clear summary
