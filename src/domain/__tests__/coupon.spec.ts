import { Coupon } from '../coupon/coupon.entity';
import { Money } from '../../shared/domain/money';

describe('Coupon', () => {
  it('applies a percent discount', () => {
    const c = Coupon.create({ tenantId: 't1', code: 'SALE10', type: 'PERCENT', value: 10 });
    expect(c.applyTo(Money.create(10000)).amountCents).toBe(1000);
  });

  it('applies a fixed discount but caps at subtotal', () => {
    const c = Coupon.create({ tenantId: 't1', code: 'FLAT', type: 'FIXED', value: 5000 });
    expect(c.applyTo(Money.create(3000)).amountCents).toBe(3000);
  });

  it('is invalid when expired', () => {
    const c = Coupon.create({
      tenantId: 't1',
      code: 'X',
      type: 'PERCENT',
      value: 10,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(c.isValid()).toBe(false);
    expect(() => c.applyTo(Money.create(100))).toThrow();
  });
});
