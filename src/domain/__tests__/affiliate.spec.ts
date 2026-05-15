import { Affiliate } from '../affiliate/affiliate.entity';

describe('Affiliate', () => {
  it('computes commission correctly', () => {
    const a = Affiliate.create({ tenantId: 't1', userId: 'u1', code: 'AF1', commissionPct: 15 });
    expect(a.computeCommissionCents(10000)).toBe(1500);
  });

  it('tracks earnings and payouts', () => {
    const a = Affiliate.create({ tenantId: 't1', userId: 'u1', code: 'AF1' });
    a.addEarning(2000);
    a.addEarning(3000);
    expect(a.totalEarned).toBe(5000);
    expect(a.pendingPayout).toBe(5000);
    a.recordPayout(2000);
    expect(a.pendingPayout).toBe(3000);
  });

  it('rejects payout exceeding pending', () => {
    const a = Affiliate.create({ tenantId: 't1', userId: 'u1', code: 'AF1' });
    a.addEarning(1000);
    expect(() => a.recordPayout(2000)).toThrow();
  });
});
