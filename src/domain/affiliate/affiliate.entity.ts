import { Entity } from '@shared/domain';
import { BusinessRuleError } from '@shared/errors/domain.errors';

export interface AffiliateProps {
  tenantId: string;
  userId: string;
  code: string;
  commissionPct: number;
  totalEarned: number;
  paidOut: number;
  active: boolean;
  createdAt: Date;
}

export class Affiliate extends Entity<AffiliateProps> {
  static create(
    props: Partial<AffiliateProps> & Pick<AffiliateProps, 'tenantId' | 'userId' | 'code'>,
    id?: string,
  ): Affiliate {
    return new Affiliate(
      {
        tenantId: props.tenantId,
        userId: props.userId,
        code: props.code,
        commissionPct: props.commissionPct ?? 10,
        totalEarned: props.totalEarned ?? 0,
        paidOut: props.paidOut ?? 0,
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
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
  get code() {
    return this.props.code;
  }
  get commissionPct() {
    return this.props.commissionPct;
  }
  get totalEarned() {
    return this.props.totalEarned;
  }
  get paidOut() {
    return this.props.paidOut;
  }
  get active() {
    return this.props.active;
  }
  get pendingPayout() {
    return this.props.totalEarned - this.props.paidOut;
  }

  computeCommissionCents(orderTotalCents: number): number {
    return Math.floor((orderTotalCents * this.props.commissionPct) / 100);
  }

  addEarning(amountCents: number): void {
    if (amountCents < 0) throw new BusinessRuleError('Negative earnings not allowed');
    this.props.totalEarned += amountCents;
  }

  recordPayout(amountCents: number): void {
    if (amountCents > this.pendingPayout) {
      throw new BusinessRuleError('Payout exceeds pending balance');
    }
    this.props.paidOut += amountCents;
  }

  deactivate(): void {
    this.props.active = false;
  }
}
