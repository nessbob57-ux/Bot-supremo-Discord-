import { Coupon } from './coupon.entity';

export interface ICouponRepository {
  findById(id: string): Promise<Coupon | null>;
  findByCode(tenantId: string, code: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<Coupon>;
}

export const COUPON_REPOSITORY = Symbol('ICouponRepository');
