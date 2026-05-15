import { Injectable } from '@nestjs/common';
import type { Tenant as PrismaTenant } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Tenant, TenantPlan } from '@domain/tenant/tenant.entity';
import { ITenantRepository } from '@domain/tenant/tenant.repository';

@Injectable()
export class TenantPrismaRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findByDiscordGuildId(guildId: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { discordGuildId: guildId } });
    return row ? this.toDomain(row) : null;
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const data = {
      name: tenant.name,
      slug: tenant.slug,
      discordGuildId: tenant.discordGuildId ?? null,
      plan: tenant.plan,
      isActive: tenant.isActive,
      whiteLabel: tenant.whiteLabel,
      settings: tenant.settings as object,
    };
    const row = await this.prisma.tenant.upsert({
      where: { id: tenant.id },
      create: { id: tenant.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaTenant): Tenant {
    return Tenant.create(
      {
        name: row.name,
        slug: row.slug,
        discordGuildId: row.discordGuildId ?? undefined,
        plan: row.plan as TenantPlan,
        isActive: row.isActive,
        whiteLabel: row.whiteLabel,
        subdomain: row.subdomain ?? undefined,
        settings: (row.settings as Record<string, unknown>) ?? {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
