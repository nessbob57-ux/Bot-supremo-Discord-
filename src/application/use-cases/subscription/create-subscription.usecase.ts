import { Inject, Injectable } from '@nestjs/common';
import { Subscription } from '@domain/subscription/subscription.aggregate';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '@domain/subscription/subscription.repository';

export interface CreateSubscriptionInput {
  tenantId: string;
  userId: string;
  planId: string;
  trialDays?: number;
  intervalDays?: number;
}

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(@Inject(SUBSCRIPTION_REPOSITORY) private readonly subs: ISubscriptionRepository) {}

  async execute(input: CreateSubscriptionInput): Promise<Subscription> {
    const now = new Date();
    const trialDays = input.trialDays ?? 0;
    const intervalDays = input.intervalDays ?? 30;
    const trialEndsAt =
      trialDays > 0 ? new Date(now.getTime() + trialDays * 86_400_000) : undefined;
    const renewsAt = new Date((trialEndsAt ?? now).getTime() + intervalDays * 86_400_000);

    const sub = Subscription.create({
      tenantId: input.tenantId,
      userId: input.userId,
      planId: input.planId,
      status: trialDays > 0 ? 'TRIAL' : 'ACTIVE',
      trialEndsAt,
      renewsAt,
    });
    return this.subs.save(sub);
  }
}
