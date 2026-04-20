export interface IWallet {
  readonly symbol: string;
  generateAddress(): Promise<string>;
  getBalance(): Promise<number>;
  createHTLC(params: { amount: number; secretHash: string; timeout: number }): Promise<string>;
  claimHTLC(params: { contractId: string; secret: string }): Promise<string>;
  refundHTLC(params: { contractId: string }): Promise<string>;
  signMessage(message: string): Promise<string>;
}
