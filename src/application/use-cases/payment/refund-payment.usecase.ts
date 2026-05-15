import { Inject, Injectable } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '@domain/order/order.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
  ) {}

  async execute(paymentId: string, full = true, reason?: string): Promise<void> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment', paymentId);

    if (full) payment.refundFull();
    else payment.refundPartial();
    await this.payments.save(payment);

    if (full && payment.orderId) {
      const order = await this.orders.findById(payment.orderId);
      if (order) {
        order.refund();
        if (reason) order['props'].notes = reason;
        await this.orders.save(order);
      }
    }
  }
}
