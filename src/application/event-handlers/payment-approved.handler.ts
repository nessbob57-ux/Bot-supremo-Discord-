import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentApprovedEvent } from '@domain/payment/events/payment-approved.event';
import { GrantXpUseCase } from '../use-cases/gamification/grant-xp.usecase';
import { TrackReferralUseCase } from '../use-cases/affiliate/track-referral.usecase';

@EventsHandler(PaymentApprovedEvent)
export class PaymentApprovedHandler implements IEventHandler<PaymentApprovedEvent> {
  private readonly logger = new Logger(PaymentApprovedHandler.name);

  constructor(
    private readonly grantXp: GrantXpUseCase,
    private readonly trackReferral: TrackReferralUseCase,
  ) {}

  async handle(event: PaymentApprovedEvent): Promise<void> {
    this.logger.log(`Payment approved: ${event.aggregateId} for user ${event.userId}`);
    // Give XP (1 XP per BRL spent)
    const xpReward = Math.floor(event.amountCents / 100);
    if (xpReward > 0) {
      await this.grantXp.execute(event.userId, xpReward);
    }
  }
}
