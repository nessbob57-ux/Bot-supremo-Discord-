import { DomainEvent } from '@shared/domain';

export class SubscriptionExpiredEvent extends DomainEvent {
  constructor(
    subscriptionId: string,
    public readonly userId: string,
    public readonly planId: string,
  ) {
    super(subscriptionId);
  }

  get eventName(): string {
    return 'subscription.expired';
  }
}
