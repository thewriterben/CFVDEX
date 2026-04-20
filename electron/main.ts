import AutoLaunch from 'auto-launch';
import { app, BrowserWindow, Menu, Tray, ipcMain } from 'electron';
import path from 'node:path';
import { DatabaseManager } from '../src/database/Database';
import { WalletManager } from '../src/wallet/WalletManager';
import { P2PNode } from '../src/network/P2PNode';
import { DistributedOrderBook } from '../src/engine/OrderBook';
import { CFVClient } from '../src/cfv/CFVClient';

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting = false;

const p2pNode = new P2PNode();
const orderBook = new DistributedOrderBook();
const db = new DatabaseManager();
const walletManager = new WalletManager();
const cfvClient = new CFVClient();

const autoLauncher = new AutoLaunch({
  name: 'CFVDEX'
});

async function configureAutoLaunch(): Promise<void> {
  const enabled = await autoLauncher.isEnabled();
  if (!enabled) {
    await autoLauncher.enable();
  }
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win?.hide();
    }
  });
}

function createTray(): void {
  tray = new Tray(path.join(process.cwd(), 'assets/icon.png'));
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (win?.isVisible()) {
          win.hide();
        } else {
          win?.show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('CFVDEX Node');
  tray.setContextMenu(menu);
}

function registerIpc(): void {
  ipcMain.handle('order:place', async (_, payload: { pair: string; side: 'buy' | 'sell'; price: number; amount: number }) => {
    const id = `order-${Date.now()}`;
    orderBook.addOrder({
      id,
      makerPeerId: 'local-peer',
      pair: payload.pair,
      side: payload.side,
      price: payload.price,
      amount: payload.amount,
      timestamp: Date.now(),
      ttl: 10 * 60 * 1000,
      signature: 'local-signature'
    });
    return id;
  });

  ipcMain.handle('order:cancel', async (_, orderId: string) => {
    orderBook.cancelOrder(orderId);
    return true;
  });

  ipcMain.handle('orderbook:get', async (_, pair: string) => orderBook.listOrders(pair));
  ipcMain.handle('wallet:balances', async () => walletManager.getAllBalances());
  ipcMain.handle(
    'peers:list',
    async () =>
      p2pNode
        .getNode()
        ?.getPeers()
        .map((peer: { toString: () => string }) => ({ id: peer.toString() })) ?? []
  );
  ipcMain.handle('cfv:price', async (_, coin: Parameters<CFVClient['getFairValue']>[0]) => cfvClient.getFairValue(coin));
}

app.whenReady().then(async () => {
  await configureAutoLaunch();
  await p2pNode.start();
  registerIpc();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // keep node process active in tray on non-macOS platforms
  }
});

app.on('before-quit', async () => {
  await p2pNode.stop();
  db.close();
});
