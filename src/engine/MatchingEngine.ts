import type { Order } from '@shared/types';

export interface MatchResult {
  buyOrder: Order;
  sellOrder: Order;
  amount: number;
  price: number;
}

export class MatchingEngine {
  match(orders: Order[]): MatchResult[] {
    const buys = orders
      .filter((order) => order.side === 'buy')
      .sort((a, b) => b.price - a.price || a.timestamp - b.timestamp)
      .map((order) => ({ ...order }));

    const sells = orders
      .filter((order) => order.side === 'sell')
      .sort((a, b) => a.price - b.price || a.timestamp - b.timestamp)
      .map((order) => ({ ...order }));

    const matches: MatchResult[] = [];

    while (buys.length > 0 && sells.length > 0) {
      const buy = buys[0];
      const sell = sells[0];

      if (buy.pair !== sell.pair || buy.price < sell.price) {
        break;
      }

      const amount = Math.min(buy.amount, sell.amount);
      matches.push({
        buyOrder: buy,
        sellOrder: sell,
        amount,
        price: sell.price
      });

      buy.amount -= amount;
      sell.amount -= amount;

      if (buy.amount <= 0) {
        buys.shift();
      }
      if (sell.amount <= 0) {
        sells.shift();
      }
    }

    return matches;
  }
}
