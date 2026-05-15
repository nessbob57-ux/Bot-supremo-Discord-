import { DomainEvent } from '@shared/domain';

export class OrderCreatedEvent extends DomainEvent {
  constructor(
    orderId: string,
    public readonly userId: string,
    public readonly totalCents: number,
  ) {
    super(orderId);
  }

  get eventName(): string {
    return 'order.created';
  }
}
