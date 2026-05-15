import { DomainEvent } from '@shared/domain';

export class PaymentFailedEvent extends DomainEvent {
  constructor(
    paymentId: string,
    public readonly userId: string,
    public readonly reason: string,
    public readonly orderId?: string,
  ) {
    super(paymentId);
  }

  get eventName(): string {
    return 'payment.failed';
  }
}
