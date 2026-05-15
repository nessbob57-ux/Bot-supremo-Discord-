import { AggregateRoot } from '@shared/domain';
import { BusinessRuleError } from '@shared/errors/domain.errors';
import { SubscriptionExpiredEvent } from './events/subscription-expired.event';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAST_DUE';
export type PlanInterval = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';

export interface SubscriptionProps {
  tenantId: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: Date;
  trialEndsAt?: Date;
  renewsAt?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  expiresAt?: Date;
  failedAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription extends AggregateRoot<SubscriptionProps> {
  static create(
    props: Partial<SubscriptionProps> & Pick<SubscriptionProps, 'tenantId' | 'userId' | 'planId'>,
    id?: string,
  ): Subscription {
    return new Subscription(
      {
        tenantId: props.tenantId,
        userId: props.userId,
        planId: props.planId,
        status: props.status ?? 'ACTIVE',
        startedAt: props.startedAt ?? new Date(),
        trialEndsAt: props.trialEndsAt,
        renewsAt: props.renewsAt,
        cancelledAt: props.cancelledAt,
        pausedAt: props.pausedAt,
        expiresAt: props.expiresAt,
        failedAttempts: props.failedAttempts ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId() {
    return this.props.tenantId;
  }
  get userId() {
    return this.props.userId;
  }
  get planId() {
    return this.props.planId;
  }
  get status() {
    return this.props.status;
  }
  get renewsAt() {
    return this.props.renewsAt;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  get trialEndsAt() {
    return this.props.trialEndsAt;
  }
  get failedAttempts() {
    return this.props.failedAttempts;
  }

  cancel(): void {
    if (this.props.status === 'CANCELLED') return;
    this.props.status = 'CANCELLED';
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.props.status === 'ACTIVE') return;
    this.props.status = 'ACTIVE';
    this.props.cancelledAt = undefined;
    this.props.pausedAt = undefined;
    this.props.updatedAt = new Date();
  }

  pause(): void {
    if (this.props.status !== 'ACTIVE') {
      throw new BusinessRuleError('Only active subscriptions can be paused');
    }
    this.props.status = 'PAUSED';
    this.props.pausedAt = new Date();
    this.props.updatedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== 'PAUSED') {
      throw new BusinessRuleError('Only paused subscriptions can be resumed');
    }
    this.props.status = 'ACTIVE';
    this.props.pausedAt = undefined;
    this.props.updatedAt = new Date();
  }

  expire(): void {
    if (this.props.status === 'EXPIRED') return;
    this.props.status = 'EXPIRED';
    this.props.expiresAt = new Date();
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new SubscriptionExpiredEvent(this.id, this.props.userId, this.props.planId),
    );
  }

  markRenewed(nextRenewsAt: Date): void {
    this.props.status = 'ACTIVE';
    this.props.renewsAt = nextRenewsAt;
    this.props.failedAttempts = 0;
    this.props.updatedAt = new Date();
  }

  registerFailedPayment(): void {
    this.props.failedAttempts += 1;
    if (this.props.failedAttempts >= 3) {
      this.props.status = 'PAST_DUE';
    }
    this.props.updatedAt = new Date();
  }

  switchPlan(planId: string): void {
    this.props.planId = planId;
    this.props.updatedAt = new Date();
  }
}
