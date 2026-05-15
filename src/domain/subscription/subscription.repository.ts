import { Subscription } from './subscription.aggregate';

export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findActiveByUser(userId: string): Promise<Subscription[]>;
  findDueForRenewal(before: Date): Promise<Subscription[]>;
  save(sub: Subscription): Promise<Subscription>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('ISubscriptionRepository');
