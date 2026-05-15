import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CartAbandonedEvent } from '@domain/cart/events/cart-abandoned.event';

@EventsHandler(CartAbandonedEvent)
export class CartAbandonedHandler implements IEventHandler<CartAbandonedEvent> {
  private readonly logger = new Logger(CartAbandonedHandler.name);

  async handle(event: CartAbandonedEvent): Promise<void> {
    this.logger.log(`Cart abandoned: ${event.aggregateId}, user ${event.userId}`);
    // Production: enqueue recovery DM via BullMQ.
  }
}
