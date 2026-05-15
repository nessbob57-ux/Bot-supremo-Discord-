import { DomainEvent } from '@shared/domain';

export class CartAbandonedEvent extends DomainEvent {
  constructor(
    cartId: string,
    public readonly userId: string,
  ) {
    super(cartId);
  }

  get eventName(): string {
    return 'cart.abandoned';
  }
}
