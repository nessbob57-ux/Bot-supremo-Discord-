import { Order } from '../order/order.aggregate';
import { Money } from '../../shared/domain/money';

describe('Order', () => {
  const make = () =>
    Order.create({
      tenantId: 't1',
      userId: 'u1',
      number: 1,
      items: [
        {
          productId: 'p1',
          productName: 'Test',
          quantity: 2,
          price: Money.create(1000),
          total: Money.create(2000),
        },
      ],
    });

  it('calculates subtotal & total', () => {
    const o = make();
    expect(o.subtotal.amountCents).toBe(2000);
    expect(o.total.amountCents).toBe(2000);
  });

  it('throws when items missing', () => {
    expect(() => Order.create({ tenantId: 't', userId: 'u', number: 1, items: [] })).toThrow();
  });

  it('transitions PENDING -> PAID', () => {
    const o = make();
    o.markPaid();
    expect(o.status).toBe('PAID');
  });

  it('cannot mark non-pending order as PAID', () => {
    const o = make();
    o.cancel();
    expect(() => o.markPaid()).toThrow();
  });

  it('emits OrderCreated on create', () => {
    const o = make();
    expect(o.domainEvents).toHaveLength(1);
    expect(o.domainEvents[0].eventName).toBe('order.created');
  });
});
