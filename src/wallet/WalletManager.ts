import { DGF_COINS } from '@shared/constants';
import type { CoinBalance } from '@shared/types';
import type { IWallet } from './IWallet';
import { DGBWallet } from './adapters/DGBWallet';
import { DASHWallet } from './adapters/DASHWallet';
import { XMRWallet } from './adapters/XMRWallet';
import { XNOWallet } from './adapters/XNOWallet';
import { ZCLWallet } from './adapters/ZCLWallet';
import { RVNWallet } from './adapters/RVNWallet';
import { XECWallet } from './adapters/XECWallet';
import { EGLDWallet } from './adapters/EGLDWallet';
import { NEARWallet } from './adapters/NEARWallet';
import { ICPWallet } from './adapters/ICPWallet';
import { XCHWallet } from './adapters/XCHWallet';
import { DGDWallet } from './adapters/DGDWallet';

export class WalletManager {
  private readonly wallets = new Map<string, IWallet>([
    ['DGB', new DGBWallet()],
    ['DASH', new DASHWallet()],
    ['XMR', new XMRWallet()],
    ['XNO', new XNOWallet()],
    ['ZCL', new ZCLWallet()],
    ['RVN', new RVNWallet()],
    ['XEC', new XECWallet()],
    ['EGLD', new EGLDWallet()],
    ['NEAR', new NEARWallet()],
    ['ICP', new ICPWallet()],
    ['XCH', new XCHWallet()],
    ['DGD', new DGDWallet()]
  ]);

  getWallet(symbol: string): IWallet {
    const wallet = this.wallets.get(symbol);
    if (!wallet) {
      throw new Error(`Unsupported wallet symbol: ${symbol}`);
    }

    return wallet;
  }

  async getAllBalances(): Promise<CoinBalance[]> {
    return Promise.all(
      DGF_COINS.map(async (coin) => {
        const wallet = this.getWallet(coin);
        const [balance, address] = await Promise.all([wallet.getBalance(), wallet.generateAddress()]);
        return { symbol: coin, balance, address };
      })
    );
  }
}
