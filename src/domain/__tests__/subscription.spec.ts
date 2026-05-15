import { Subscription } from '../subscription/subscription.aggregate';

describe('Subscription', () => {
  it('cancellation transitions to CANCELLED', () => {
    const s = Subscription.create({ tenantId: 't1', userId: 'u1', planId: 'p1' });
    s.cancel();
    expect(s.status).toBe('CANCELLED');
  });

  it('pauses and resumes only when valid', () => {
    const s = Subscription.create({ tenantId: 't1', userId: 'u1', planId: 'p1' });
    s.pause();
    expect(s.status).toBe('PAUSED');
    s.resume();
    expect(s.status).toBe('ACTIVE');
    expect(() => s.resume()).toThrow();
  });

  it('marks PAST_DUE after 3 failed payments', () => {
    const s = Subscription.create({ tenantId: 't1', userId: 'u1', planId: 'p1' });
    s.registerFailedPayment();
    s.registerFailedPayment();
    expect(s.status).toBe('ACTIVE');
    s.registerFailedPayment();
    expect(s.status).toBe('PAST_DUE');
  });

  it('emits SubscriptionExpiredEvent on expire', () => {
    const s = Subscription.create({ tenantId: 't1', userId: 'u1', planId: 'p1' });
    s.expire();
    expect(s.status).toBe('EXPIRED');
    expect(s.domainEvents).toHaveLength(1);
  });
});
