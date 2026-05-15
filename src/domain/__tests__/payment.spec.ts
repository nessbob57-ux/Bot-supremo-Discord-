import { Payment } from '../payment/payment.aggregate';
import { Money } from '../../shared/domain/money';

describe('Payment', () => {
  it('starts pending', () => {
    const p = Payment.create({ userId: 'u1', amount: Money.create(5000) });
    expect(p.status).toBe('PENDING');
  });

  it('approve emits domain event', () => {
    const p = Payment.create({ userId: 'u1', amount: Money.create(5000) });
    p.approve('ext-1');
    expect(p.status).toBe('APPROVED');
    expect(p.domainEvents).toHaveLength(1);
    expect(p.domainEvents[0].eventName).toBe('payment.approved');
  });

  it('cannot refund non-approved payment', () => {
    const p = Payment.create({ userId: 'u1', amount: Money.create(5000) });
    expect(() => p.refundFull()).toThrow();
  });

  it('refundFull after approval', () => {
    const p = Payment.create({ userId: 'u1', amount: Money.create(5000) });
    p.approve();
    p.refundFull();
    expect(p.status).toBe('REFUNDED');
  });
});
