import { Wallet } from './wallet.aggregate';

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<Wallet>;
}

export const WALLET_REPOSITORY = Symbol('IWalletRepository');
