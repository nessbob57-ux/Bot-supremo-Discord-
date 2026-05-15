import { DomainEvent } from '@shared/domain';

export class PaymentApprovedEvent extends DomainEvent {
  constructor(
    paymentId: string,
    public readonly userId: string,
    public readonly amountCents: number,
    public readonly orderId?: string,
  ) {
    super(paymentId);
  }

  get eventName(): string {
    return 'payment.approved';
  }
}
