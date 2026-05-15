import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@shared/domain';
import { Wallet } from '@domain/wallet/wallet.aggregate';
import { IWalletRepository, WALLET_REPOSITORY } from '@domain/wallet/wallet.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class DebitWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository) {}

  async execute(userId: string, amountCents: number, description?: string): Promise<Wallet> {
    const wallet = await this.wallets.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet', userId);
    wallet.debit(Money.create(amountCents), description);
    return this.wallets.save(wallet);
  }
}
