import { Money } from '../../shared/domain/money';

describe('Money', () => {
  it('adds two Money values with the same currency', () => {
    const a = Money.create(1000, 'BRL');
    const b = Money.create(2500, 'BRL');
    expect(a.add(b).amountCents).toBe(3500);
  });

  it('throws when adding different currencies', () => {
    expect(() => Money.create(1000, 'BRL').add(Money.create(100, 'USD'))).toThrow();
  });

  it('multiplies by quantity', () => {
    expect(Money.create(500, 'BRL').multiply(3).amountCents).toBe(1500);
  });

  it('computes percent', () => {
    expect(Money.create(10000, 'BRL').percent(15).amountCents).toBe(1500);
  });

  it('formats in pt-BR', () => {
    expect(Money.create(12345, 'BRL').format()).toContain('R$');
  });
});
