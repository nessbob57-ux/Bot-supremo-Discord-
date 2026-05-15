import { Affiliate } from './affiliate.entity';

export interface IAffiliateRepository {
  findById(id: string): Promise<Affiliate | null>;
  findByCode(code: string): Promise<Affiliate | null>;
  findByUserId(userId: string): Promise<Affiliate | null>;
  topByEarnings(tenantId: string, limit: number): Promise<Affiliate[]>;
  save(affiliate: Affiliate): Promise<Affiliate>;
}

export const AFFILIATE_REPOSITORY = Symbol('IAffiliateRepository');
