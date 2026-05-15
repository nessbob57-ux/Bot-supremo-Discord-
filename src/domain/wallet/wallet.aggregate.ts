import { AggregateRoot, Money } from '@shared/domain';
import { BusinessRuleError } from '@shared/errors/domain.errors';

export interface WalletMovementProps {
  amount: Money;
  type: 'CREDIT' | 'DEBIT';
  description?: string;
  createdAt: Date;
}

export interface WalletProps {
  userId: string;
  balance: Money;
  movements: WalletMovementProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet extends AggregateRoot<WalletProps> {
  static create(props: Partial<WalletProps> & Pick<WalletProps, 'userId'>, id?: string): Wallet {
    const currency = props.balance?.currency ?? Money.DEFAULT_CURRENCY;
    return new Wallet(
      {
        userId: props.userId,
        balance: props.balance ?? Money.zero(currency),
        movements: props.movements ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get userId() {
    return this.props.userId;
  }
  get balance() {
    return this.props.balance;
  }
  get movements() {
    return this.props.movements;
  }

  credit(amount: Money, description?: string): void {
    if (amount.isNegative() || amount.isZero()) {
      throw new BusinessRuleError('Credit amount must be positive');
    }
    this.props.balance = this.props.balance.add(amount);
    this.props.movements.push({ amount, type: 'CREDIT', description, createdAt: new Date() });
    this.props.updatedAt = new Date();
  }

  debit(amount: Money, description?: string): void {
    if (amount.isNegative() || amount.isZero()) {
      throw new BusinessRuleError('Debit amount must be positive');
    }
    if (this.props.balance.amountCents < amount.amountCents) {
      throw new BusinessRuleError('Insufficient wallet balance');
    }
    this.props.balance = this.props.balance.subtract(amount);
    this.props.movements.push({ amount, type: 'DEBIT', description, createdAt: new Date() });
    this.props.updatedAt = new Date();
  }
}
