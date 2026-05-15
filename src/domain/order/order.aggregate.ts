import { AggregateRoot, Money } from '@shared/domain';
import { BusinessRuleError, ValidationError } from '@shared/errors/domain.errors';
import { OrderCreatedEvent } from './events/order-created.event';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED'
  | 'EXPIRED';

export interface OrderItemProps {
  productId: string;
  productName: string;
  quantity: number;
  price: Money;
  total: Money;
  metadata?: Record<string, unknown>;
}

export interface OrderProps {
  tenantId: string;
  userId: string;
  number: number;
  status: OrderStatus;
  items: OrderItemProps[];
  subtotal: Money;
  discount: Money;
  tax: Money;
  total: Money;
  couponCode?: string;
  affiliateId?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  static create(
    props: Partial<OrderProps> & Pick<OrderProps, 'tenantId' | 'userId' | 'number' | 'items'>,
    id?: string,
  ): Order {
    if (!props.items || props.items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }
    const currency = props.items[0].price.currency;
    const subtotal = props.items.reduce(
      (acc, it) => acc.add(it.price.multiply(it.quantity)),
      Money.zero(currency),
    );
    const discount = props.discount ?? Money.zero(currency);
    const tax = props.tax ?? Money.zero(currency);
    const total = subtotal.subtract(discount).add(tax);

    const order = new Order(
      {
        tenantId: props.tenantId,
        userId: props.userId,
        number: props.number,
        status: props.status ?? 'PENDING',
        items: props.items,
        subtotal,
        discount,
        tax,
        total,
        couponCode: props.couponCode,
        affiliateId: props.affiliateId,
        notes: props.notes,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    order.addDomainEvent(
      new OrderCreatedEvent(order.id, order.props.userId, order.total.amountCents),
    );
    return order;
  }

  get tenantId() {
    return this.props.tenantId;
  }
  get userId() {
    return this.props.userId;
  }
  get number() {
    return this.props.number;
  }
  get status() {
    return this.props.status;
  }
  get items() {
    return this.props.items;
  }
  get subtotal() {
    return this.props.subtotal;
  }
  get discount() {
    return this.props.discount;
  }
  get tax() {
    return this.props.tax;
  }
  get total() {
    return this.props.total;
  }
  get couponCode() {
    return this.props.couponCode;
  }
  get affiliateId() {
    return this.props.affiliateId;
  }
  get notes() {
    return this.props.notes;
  }
  get metadata() {
    return this.props.metadata;
  }

  markPaid(): void {
    if (this.props.status !== 'PENDING' && this.props.status !== 'PROCESSING') {
      throw new BusinessRuleError(`Cannot mark order ${this.props.status} as PAID`);
    }
    this.props.status = 'PAID';
    this.props.updatedAt = new Date();
  }

  markDelivered(): void {
    this.props.status = 'DELIVERED';
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === 'DELIVERED' || this.props.status === 'REFUNDED') {
      throw new BusinessRuleError(`Cannot cancel ${this.props.status} order`);
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === 'PENDING') {
      this.props.status = 'EXPIRED';
      this.props.updatedAt = new Date();
    }
  }

  fail(reason?: string): void {
    this.props.status = 'FAILED';
    if (reason) this.props.notes = reason;
    this.props.updatedAt = new Date();
  }

  refund(): void {
    if (this.props.status !== 'PAID' && this.props.status !== 'DELIVERED') {
      throw new BusinessRuleError(`Cannot refund ${this.props.status} order`);
    }
    this.props.status = 'REFUNDED';
    this.props.updatedAt = new Date();
  }
}
