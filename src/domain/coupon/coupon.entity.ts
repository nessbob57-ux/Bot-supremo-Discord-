import { Entity, Money } from '@shared/domain';
import { BusinessRuleError } from '@shared/errors/domain.errors';

export type CouponType = 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';

export interface CouponProps {
  tenantId: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderCents: number;
  maxUses?: number;
  uses: number;
  perUserLimit?: number;
  startsAt?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

export class Coupon extends Entity<CouponProps> {
  static create(
    props: Partial<CouponProps> & Pick<CouponProps, 'tenantId' | 'code' | 'type' | 'value'>,
    id?: string,
  ): Coupon {
    return new Coupon(
      {
        tenantId: props.tenantId,
        code: props.code.toUpperCase(),
        description: props.description,
        type: props.type,
        value: props.value,
        minOrderCents: props.minOrderCents ?? 0,
        maxUses: props.maxUses,
        uses: props.uses ?? 0,
        perUserLimit: props.perUserLimit,
        startsAt: props.startsAt,
        expiresAt: props.expiresAt,
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get code() {
    return this.props.code;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get type() {
    return this.props.type;
  }
  get value() {
    return this.props.value;
  }
  get active() {
    return this.props.active;
  }
  get uses() {
    return this.props.uses;
  }
  get maxUses() {
    return this.props.maxUses;
  }
  get minOrderCents() {
    return this.props.minOrderCents;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }

  isValid(now = new Date()): boolean {
    if (!this.props.active) return false;
    if (this.props.startsAt && this.props.startsAt > now) return false;
    if (this.props.expiresAt && this.props.expiresAt < now) return false;
    if (this.props.maxUses && this.props.uses >= this.props.maxUses) return false;
    return true;
  }

  applyTo(subtotal: Money): Money {
    if (!this.isValid()) throw new BusinessRuleError('Invalid coupon');
    if (subtotal.amountCents < this.props.minOrderCents) {
      throw new BusinessRuleError('Order does not meet minimum amount');
    }
    let discountCents = 0;
    if (this.props.type === 'PERCENT') {
      discountCents = Math.floor((subtotal.amountCents * this.props.value) / 100);
    } else if (this.props.type === 'FIXED') {
      discountCents = this.props.value;
    }
    discountCents = Math.min(discountCents, subtotal.amountCents);
    return Money.create(discountCents, subtotal.currency);
  }

  redeem(): void {
    if (!this.isValid()) throw new BusinessRuleError('Invalid coupon');
    this.props.uses += 1;
  }

  deactivate(): void {
    this.props.active = false;
  }
}
