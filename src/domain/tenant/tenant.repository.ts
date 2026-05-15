import { Tenant } from './tenant.entity';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findByDiscordGuildId(guildId: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<Tenant>;
}

export const TENANT_REPOSITORY = Symbol('ITenantRepository');
