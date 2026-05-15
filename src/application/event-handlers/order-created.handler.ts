import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderCreatedEvent } from '@domain/order/events/order-created.event';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  async handle(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Order created: ${event.aggregateId} (total ${event.totalCents / 100})`);
  }
}
