import { Inject, Injectable } from '@nestjs/common';
import { IAffiliateRepository, AFFILIATE_REPOSITORY } from '@domain/affiliate/affiliate.repository';
import { CreditWalletUseCase } from '../wallet/credit-wallet.usecase';

@Injectable()
export class TrackReferralUseCase {
  constructor(
    @Inject(AFFILIATE_REPOSITORY) private readonly affiliates: IAffiliateRepository,
    private readonly creditWallet: CreditWalletUseCase,
  ) {}

  async execute(affiliateCode: string, orderTotalCents: number): Promise<void> {
    const affiliate = await this.affiliates.findByCode(affiliateCode);
    if (!affiliate || !affiliate.active) return;
    const commission = affiliate.computeCommissionCents(orderTotalCents);
    if (commission <= 0) return;
    affiliate.addEarning(commission);
    await this.affiliates.save(affiliate);
    await this.creditWallet.execute(
      affiliate.userId,
      commission,
      `Comissão de afiliado (${affiliate.code})`,
    );
  }
}
