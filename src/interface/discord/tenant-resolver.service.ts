import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '@domain/tenant/tenant.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '@domain/tenant/tenant.repository';

@Injectable()
export class TenantResolverService {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository) {}

  async resolveOrCreate(guildId: string, guildName: string): Promise<Tenant> {
    let tenant = await this.tenants.findByDiscordGuildId(guildId);
    if (tenant) return tenant;
    const slug = `${guildName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${guildId.slice(-4)}`;
    tenant = Tenant.create({ name: guildName, slug, discordGuildId: guildId });
    return this.tenants.save(tenant);
  }
}
