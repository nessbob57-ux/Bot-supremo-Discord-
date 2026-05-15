import { Wallet } from '../wallet/wallet.aggregate';
import { Money } from '../../shared/domain/money';

describe('Wallet', () => {
  it('credits and debits balance', () => {
    const w = Wallet.create({ userId: 'u1' });
    w.credit(Money.create(5000), 'top-up');
    expect(w.balance.amountCents).toBe(5000);
    w.debit(Money.create(1500), 'purchase');
    expect(w.balance.amountCents).toBe(3500);
  });

  it('rejects negative credit', () => {
    expect(() => Wallet.create({ userId: 'u1' }).credit(Money.create(-100))).toThrow();
  });

  it('rejects overdraft debit', () => {
    expect(() => Wallet.create({ userId: 'u1' }).debit(Money.create(100))).toThrow();
  });
});
