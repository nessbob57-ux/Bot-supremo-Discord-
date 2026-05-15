import { Inject, Injectable } from '@nestjs/common';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { ICouponRepository, COUPON_REPOSITORY } from '@domain/coupon/coupon.repository';
import { BusinessRuleError, NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class ApplyCouponUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: ICartRepository,
    @Inject(COUPON_REPOSITORY) private readonly coupons: ICouponRepository,
  ) {}

  async execute(tenantId: string, userId: string, code: string): Promise<void> {
    const cart = await this.carts.findActiveByUser(userId);
    if (!cart) throw new NotFoundError('Cart');
    const coupon = await this.coupons.findByCode(tenantId, code);
    if (!coupon) throw new NotFoundError('Coupon', code);
    if (!coupon.isValid()) throw new BusinessRuleError('Coupon is not valid');
    cart.applyCoupon(coupon.id);
    await this.carts.save(cart);
  }
}
