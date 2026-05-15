import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Money } from '@shared/domain';
import { Order } from '@domain/order/order.aggregate';
import { Payment } from '@domain/payment/payment.aggregate';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '@domain/order/order.repository';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/product/product.repository';
import { ICouponRepository, COUPON_REPOSITORY } from '@domain/coupon/coupon.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/payment/payment.gateway';
import { BusinessRuleError, NotFoundError } from '@shared/errors/domain.errors';

export interface CheckoutInput {
  tenantId: string;
  userId: string;
  affiliateCode?: string;
}

export interface CheckoutResult {
  order: Order;
  payment: Payment;
}

@Injectable()
export class CheckoutUseCase {
  private readonly logger = new Logger(CheckoutUseCase.name);

  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: ICartRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    @Inject(COUPON_REPOSITORY) private readonly coupons: ICouponRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CheckoutInput): Promise<CheckoutResult> {
    const cart = await this.carts.findActiveByUser(input.userId);
    if (!cart || cart.isEmpty) throw new BusinessRuleError('Cart is empty');

    const itemsResolved = await Promise.all(
      cart.items.map(async (it) => {
        const product = await this.products.findById(it.productId);
        if (!product) throw new NotFoundError('Product', it.productId);
        if (!product.canBeSold(it.quantity)) {
          throw new BusinessRuleError(`Product ${product.name} not available`);
        }
        return { product, quantity: it.quantity };
      }),
    );

    let discount = Money.zero();
    let couponCode: string | undefined;
    if (cart.couponId) {
      const coupon = await this.coupons.findById(cart.couponId);
      if (coupon && coupon.isValid()) {
        const subtotalMoney = cart.subtotal();
        discount = coupon.applyTo(subtotalMoney);
        couponCode = coupon.code;
        coupon.redeem();
        await this.coupons.save(coupon);
      }
    }

    const number = await this.orders.nextOrderNumber(input.tenantId);
    const order = Order.create({
      tenantId: input.tenantId,
      userId: input.userId,
      number,
      items: itemsResolved.map(({ product, quantity }) => ({
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        total: product.price.multiply(quantity),
      })),
      discount,
      couponCode,
    });

    // Reserve stock
    for (const { product, quantity } of itemsResolved) {
      product.reserveStock(quantity);
      await this.products.save(product);
    }

    await this.orders.save(order);

    // Create payment
    const payment = Payment.create({
      orderId: order.id,
      userId: input.userId,
      amount: order.total,
      method: 'PIX',
    });

    const charge = await this.gateway.charge({
      paymentId: payment.id,
      userId: input.userId,
      amount: order.total,
      description: `Pedido #${order.number}`,
      metadata: { orderId: order.id },
    });
    payment['props'].externalId = charge.externalId;
    payment.attachPixData(charge.pixCode, charge.qrCodeData, charge.expiresAt);
    await this.payments.save(payment);

    // Clear cart
    cart.checkout();
    await this.carts.save(cart);

    // Publish domain events
    for (const e of order.domainEvents) {
      this.eventBus.publish(e);
    }
    order.clearEvents();

    this.logger.log(`Checkout completed: order #${order.number}, payment ${payment.id}`);
    return { order, payment };
  }
}
