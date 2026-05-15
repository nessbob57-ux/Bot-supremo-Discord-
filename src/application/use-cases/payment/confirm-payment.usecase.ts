import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Payment } from '@domain/payment/payment.aggregate';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '@domain/order/order.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class ConfirmPaymentUseCase {
  private readonly logger = new Logger(ConfirmPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(paymentId: string): Promise<Payment> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment', paymentId);

    if (payment.status === 'APPROVED') return payment;

    payment.approve();
    await this.payments.save(payment);

    if (payment.orderId) {
      const order = await this.orders.findById(payment.orderId);
      if (order) {
        order.markPaid();
        await this.orders.save(order);
      }
    }

    for (const e of payment.domainEvents) {
      this.eventBus.publish(e);
    }
    payment.clearEvents();

    this.logger.log(`Payment ${paymentId} confirmed`);
    return payment;
  }
}
