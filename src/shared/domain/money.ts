import { ValueObject } from './value-object.base';

export interface MoneyProps {
  amountCents: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  static readonly DEFAULT_CURRENCY = 'BRL';

  static create(amountCents: number, currency = Money.DEFAULT_CURRENCY): Money {
    if (!Number.isInteger(amountCents)) {
      throw new Error('Money.amountCents must be an integer (cents)');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Money.currency must be a 3-letter ISO code');
    }
    return new Money({ amountCents, currency: currency.toUpperCase() });
  }

  static zero(currency = Money.DEFAULT_CURRENCY): Money {
    return Money.create(0, currency);
  }

  get amountCents(): number {
    return this.props.amountCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get amount(): number {
    return this.props.amountCents / 100;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amountCents + other.amountCents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amountCents - other.amountCents, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(Math.round(this.amountCents * factor), this.currency);
  }

  percent(pct: number): Money {
    return Money.create(Math.round((this.amountCents * pct) / 100), this.currency);
  }

  isZero(): boolean {
    return this.amountCents === 0;
  }

  isNegative(): boolean {
    return this.amountCents < 0;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountCents > other.amountCents;
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
