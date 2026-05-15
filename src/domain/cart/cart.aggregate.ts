import { AggregateRoot, Money } from '@shared/domain';
import { BusinessRuleError, ValidationError } from '@shared/errors/domain.errors';
import { CartAbandonedEvent } from './events/cart-abandoned.event';

export type CartStatus = 'ACTIVE' | 'ABANDONED' | 'CHECKED_OUT';

export interface CartItemProps {
  productId: string;
  quantity: number;
  price: Money;
}

export interface CartProps {
  userId: string;
  status: CartStatus;
  items: CartItemProps[];
  couponId?: string;
  abandonedAt?: Date;
  recoveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Cart extends AggregateRoot<CartProps> {
  static create(props: Partial<CartProps> & Pick<CartProps, 'userId'>, id?: string): Cart {
    return new Cart(
      {
        userId: props.userId,
        status: props.status ?? 'ACTIVE',
        items: props.items ?? [],
        couponId: props.couponId,
        abandonedAt: props.abandonedAt,
        recoveredAt: props.recoveredAt,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get userId() {
    return this.props.userId;
  }
  get status() {
    return this.props.status;
  }
  get items() {
    return this.props.items;
  }
  get couponId() {
    return this.props.couponId;
  }
  get isEmpty() {
    return this.props.items.length === 0;
  }

  addItem(productId: string, quantity: number, price: Money): void {
    if (quantity <= 0) throw new ValidationError('Quantity must be > 0');
    if (this.props.status !== 'ACTIVE') {
      throw new BusinessRuleError('Cannot modify a non-active cart');
    }
    const existing = this.props.items.find((it) => it.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.props.items.push({ productId, quantity, price });
    }
    this.props.updatedAt = new Date();
  }

  updateItem(productId: string, quantity: number): void {
    const item = this.props.items.find((it) => it.productId === productId);
    if (!item) throw new BusinessRuleError(`Item ${productId} not found in cart`);
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    item.quantity = quantity;
    this.props.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.props.items = this.props.items.filter((it) => it.productId !== productId);
    this.props.updatedAt = new Date();
  }

  clear(): void {
    this.props.items = [];
    this.props.couponId = undefined;
    this.props.updatedAt = new Date();
  }

  applyCoupon(couponId: string): void {
    this.props.couponId = couponId;
    this.props.updatedAt = new Date();
  }

  removeCoupon(): void {
    this.props.couponId = undefined;
    this.props.updatedAt = new Date();
  }

  markAbandoned(): void {
    if (this.props.status !== 'ACTIVE') return;
    this.props.status = 'ABANDONED';
    this.props.abandonedAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent(new CartAbandonedEvent(this.id, this.props.userId));
  }

  recover(): void {
    if (this.props.status !== 'ABANDONED') return;
    this.props.status = 'ACTIVE';
    this.props.recoveredAt = new Date();
    this.props.updatedAt = new Date();
  }

  checkout(): void {
    if (this.isEmpty) throw new BusinessRuleError('Cannot checkout empty cart');
    this.props.status = 'CHECKED_OUT';
    this.props.updatedAt = new Date();
  }

  subtotal(currency = Money.DEFAULT_CURRENCY): Money {
    return this.props.items.reduce(
      (acc, it) => acc.add(it.price.multiply(it.quantity)),
      Money.zero(currency),
    );
  }
}
