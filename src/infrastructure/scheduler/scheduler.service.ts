import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventBus } from '@nestjs/cqrs';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '@domain/subscription/subscription.repository';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: ICartRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: ISubscriptionRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireOldPayments(): Promise<void> {
    try {
      const expired = await this.payments.findPendingExpiredBefore(new Date());
      for (const payment of expired) {
        payment.expire();
        await this.payments.save(payment);
      }
      if (expired.length > 0) this.logger.log(`Expired ${expired.length} stale payments`);
    } catch (err) {
      this.logger.warn(`expireOldPayments skipped: ${(err as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async detectAbandonedCarts(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const carts = await this.carts.findAbandonedOlderThan(threshold);
      for (const cart of carts) {
        cart.markAbandoned();
        await this.carts.save(cart);
        for (const e of cart.domainEvents) this.eventBus.publish(e);
        cart.clearEvents();
      }
      if (carts.length > 0) this.logger.log(`Marked ${carts.length} carts as abandoned`);
    } catch (err) {
      this.logger.warn(`detectAbandonedCarts skipped: ${(err as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async renewSubscriptions(): Promise<void> {
    try {
      const dueSubs = await this.subs.findDueForRenewal(new Date());
      for (const sub of dueSubs) {
        const nextRenewsAt = new Date(Date.now() + 30 * 86_400_000);
        sub.markRenewed(nextRenewsAt);
        await this.subs.save(sub);
      }
      if (dueSubs.length > 0) this.logger.log(`Renewed ${dueSubs.length} subscriptions`);
    } catch (err) {
      this.logger.warn(`renewSubscriptions skipped: ${(err as Error).message}`);
    }
  }
}
