import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@shared/domain';
import { Wallet } from '@domain/wallet/wallet.aggregate';
import { IWalletRepository, WALLET_REPOSITORY } from '@domain/wallet/wallet.repository';

@Injectable()
export class CreditWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository) {}

  async execute(userId: string, amountCents: number, description?: string): Promise<Wallet> {
    let wallet = await this.wallets.findByUserId(userId);
    if (!wallet) wallet = Wallet.create({ userId });
    wallet.credit(Money.create(amountCents), description);
    return this.wallets.save(wallet);
  }
}
