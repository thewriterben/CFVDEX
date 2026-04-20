/// <reference types="vite/client" />

declare global {
  interface Window {
    cfvdex: {
      placeOrder: (payload: { pair: string; side: 'buy' | 'sell'; price: number; amount: number }) => Promise<string>;
      cancelOrder: (orderId: string) => Promise<boolean>;
      getOrderBook: (pair: string) => Promise<unknown[]>;
      getWalletBalance: () => Promise<unknown>;
      getPeers: () => Promise<unknown[]>;
      getCFVPrice: (coin: string) => Promise<number | null>;
    };
  }
}

export {};
