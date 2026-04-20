import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cfvdex', {
  placeOrder: (payload: { pair: string; side: 'buy' | 'sell'; price: number; amount: number }) =>
    ipcRenderer.invoke('order:place', payload),
  cancelOrder: (orderId: string) => ipcRenderer.invoke('order:cancel', orderId),
  getOrderBook: (pair: string) => ipcRenderer.invoke('orderbook:get', pair),
  getWalletBalance: () => ipcRenderer.invoke('wallet:balances'),
  getPeers: () => ipcRenderer.invoke('peers:list'),
  getCFVPrice: (coin: string) => ipcRenderer.invoke('cfv:price', coin)
});
