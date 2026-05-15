import { AggregateRoot } from '@shared/domain';
import { UserSegmentUpdatedEvent } from './events/user-segment-updated.event';

export interface UserProps {
  tenantId: string;
  discordId: string;
  username: string;
  email?: string;
  trustScore: number;
  isBanned: boolean;
  isAdmin: boolean;
  language: string;
  segment?: string;
  xp: number;
  level: number;
  streak: number;
  consentLGPD: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  static create(
    props: Partial<UserProps> & Pick<UserProps, 'tenantId' | 'discordId' | 'username'>,
    id?: string,
  ): User {
    return new User(
      {
        tenantId: props.tenantId,
        discordId: props.discordId,
        username: props.username,
        email: props.email,
        trustScore: props.trustScore ?? 50,
        isBanned: props.isBanned ?? false,
        isAdmin: props.isAdmin ?? false,
        language: props.language ?? 'pt-BR',
        segment: props.segment,
        xp: props.xp ?? 0,
        level: props.level ?? 1,
        streak: props.streak ?? 0,
        consentLGPD: props.consentLGPD ?? false,
        lastActiveAt: props.lastActiveAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId() {
    return this.props.tenantId;
  }
  get discordId() {
    return this.props.discordId;
  }
  get username() {
    return this.props.username;
  }
  get email() {
    return this.props.email;
  }
  get trustScore() {
    return this.props.trustScore;
  }
  get isBanned() {
    return this.props.isBanned;
  }
  get isAdmin() {
    return this.props.isAdmin;
  }
  get xp() {
    return this.props.xp;
  }
  get level() {
    return this.props.level;
  }
  get streak() {
    return this.props.streak;
  }
  get segment() {
    return this.props.segment;
  }
  get language() {
    return this.props.language;
  }
  get consentLGPD() {
    return this.props.consentLGPD;
  }

  addXp(amount: number): void {
    if (amount <= 0) return;
    this.props.xp += amount;
    const newLevel = User.calculateLevel(this.props.xp);
    if (newLevel > this.props.level) {
      this.props.level = newLevel;
    }
    this.props.updatedAt = new Date();
  }

  static calculateLevel(xp: number): number {
    // Simple curve: level = floor(sqrt(xp / 50)) + 1
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  }

  incrementStreak(): void {
    this.props.streak += 1;
    this.props.updatedAt = new Date();
  }

  resetStreak(): void {
    this.props.streak = 0;
    this.props.updatedAt = new Date();
  }

  ban(): void {
    this.props.isBanned = true;
    this.props.updatedAt = new Date();
  }

  unban(): void {
    this.props.isBanned = false;
    this.props.updatedAt = new Date();
  }

  promote(): void {
    this.props.isAdmin = true;
    this.props.updatedAt = new Date();
  }

  updateSegment(segment: string): void {
    if (this.props.segment === segment) return;
    this.props.segment = segment;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserSegmentUpdatedEvent(this.id, segment));
  }

  adjustTrustScore(delta: number): void {
    this.props.trustScore = Math.max(0, Math.min(100, this.props.trustScore + delta));
    this.props.updatedAt = new Date();
  }

  giveConsent(): void {
    this.props.consentLGPD = true;
    this.props.updatedAt = new Date();
  }

  markActive(): void {
    this.props.lastActiveAt = new Date();
  }

  anonymize(): void {
    this.props.username = `anonymized_${this.id.slice(0, 8)}`;
    this.props.email = undefined;
    this.props.updatedAt = new Date();
  }

  toJSON(): UserProps & { id: string } {
    return { id: this.id, ...this.props };
  }
}
