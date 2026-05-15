import { Inject, Injectable } from '@nestjs/common';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '@domain/subscription/subscription.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(@Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: ISubscriptionRepository) {}

  async execute(id: string): Promise<void> {
    const sub = await this.subs.findById(id);
    if (!sub) throw new NotFoundError('Subscription', id);
    sub.cancel();
    await this.subs.save(sub);
  }
}
