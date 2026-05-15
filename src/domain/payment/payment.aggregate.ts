import { AggregateRoot, Money } from '@shared/domain';
import { BusinessRuleError } from '@shared/errors/domain.errors';
import { PaymentApprovedEvent } from './events/payment-approved.event';
import { PaymentFailedEvent } from './events/payment-failed.event';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'WALLET' | 'CRYPTO' | 'EXTERNAL';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED';

export interface PaymentProps {
  orderId?: string;
  userId: string;
  amount: Money;
  method: PaymentMethod;
  status: PaymentStatus;
  externalId?: string;
  pixCode?: string;
  qrCodeData?: string;
  attempts: number;
  failureReason?: string;
  expiresAt?: Date;
  paidAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment extends AggregateRoot<PaymentProps> {
  static create(
    props: Partial<PaymentProps> & Pick<PaymentProps, 'userId' | 'amount'>,
    id?: string,
  ): Payment {
    return new Payment(
      {
        orderId: props.orderId,
        userId: props.userId,
        amount: props.amount,
        method: props.method ?? 'PIX',
        status: props.status ?? 'PENDING',
        externalId: props.externalId,
        pixCode: props.pixCode,
        qrCodeData: props.qrCodeData,
        attempts: props.attempts ?? 0,
        failureReason: props.failureReason,
        expiresAt: props.expiresAt,
        paidAt: props.paidAt,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get orderId() {
    return this.props.orderId;
  }
  get userId() {
    return this.props.userId;
  }
  get amount() {
    return this.props.amount;
  }
  get method() {
    return this.props.method;
  }
  get status() {
    return this.props.status;
  }
  get externalId() {
    return this.props.externalId;
  }
  get pixCode() {
    return this.props.pixCode;
  }
  get qrCodeData() {
    return this.props.qrCodeData;
  }
  get attempts() {
    return this.props.attempts;
  }
  get failureReason() {
    return this.props.failureReason;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get paidAt() {
    return this.props.paidAt;
  }
  get metadata() {
    return this.props.metadata;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  attachPixData(pixCode: string, qrCodeData: string, expiresAt: Date): void {
    this.props.pixCode = pixCode;
    this.props.qrCodeData = qrCodeData;
    this.props.expiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  approve(externalId?: string): void {
    if (this.props.status === 'APPROVED') return;
    if (this.props.status === 'REFUNDED' || this.props.status === 'PARTIALLY_REFUNDED') {
      throw new BusinessRuleError('Cannot approve a refunded payment');
    }
    this.props.status = 'APPROVED';
    this.props.paidAt = new Date();
    if (externalId) this.props.externalId = externalId;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PaymentApprovedEvent(
        this.id,
        this.props.userId,
        this.props.amount.amountCents,
        this.props.orderId,
      ),
    );
  }

  fail(reason: string): void {
    this.props.status = 'FAILED';
    this.props.failureReason = reason;
    this.props.attempts += 1;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new PaymentFailedEvent(this.id, this.props.userId, reason, this.props.orderId),
    );
  }

  reject(reason: string): void {
    this.props.status = 'REJECTED';
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === 'PENDING' || this.props.status === 'PROCESSING') {
      this.props.status = 'EXPIRED';
      this.props.updatedAt = new Date();
    }
  }

  refundFull(): void {
    if (this.props.status !== 'APPROVED') {
      throw new BusinessRuleError('Cannot refund a non-approved payment');
    }
    this.props.status = 'REFUNDED';
    this.props.updatedAt = new Date();
  }

  refundPartial(): void {
    if (this.props.status !== 'APPROVED' && this.props.status !== 'PARTIALLY_REFUNDED') {
      throw new BusinessRuleError('Cannot partially refund a non-approved payment');
    }
    this.props.status = 'PARTIALLY_REFUNDED';
    this.props.updatedAt = new Date();
  }

  retry(): void {
    if (this.props.status === 'APPROVED') {
      throw new BusinessRuleError('Cannot retry approved payment');
    }
    this.props.status = 'PENDING';
    this.props.attempts += 1;
    this.props.failureReason = undefined;
    this.props.updatedAt = new Date();
  }

  isExpired(now = new Date()): boolean {
    return !!this.props.expiresAt && this.props.expiresAt < now;
  }
}
