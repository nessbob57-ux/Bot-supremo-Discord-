import { Injectable } from '@nestjs/common';
import type { Affiliate as PrismaAffiliate } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Affiliate } from '@domain/affiliate/affiliate.entity';
import { IAffiliateRepository } from '@domain/affiliate/affiliate.repository';

@Injectable()
export class AffiliatePrismaRepository implements IAffiliateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Affiliate | null> {
    const row = await this.prisma.affiliate.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(code: string): Promise<Affiliate | null> {
    const row = await this.prisma.affiliate.findUnique({ where: { code } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Affiliate | null> {
    const row = await this.prisma.affiliate.findUnique({ where: { userId } });
    return row ? this.toDomain(row) : null;
  }

  async topByEarnings(tenantId: string, limit: number): Promise<Affiliate[]> {
    const rows = await this.prisma.affiliate.findMany({
      where: { tenantId, active: true },
      orderBy: { totalEarned: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(affiliate: Affiliate): Promise<Affiliate> {
    const data = {
      tenantId: affiliate.tenantId,
      userId: affiliate.userId,
      code: affiliate.code,
      commissionPct: affiliate.commissionPct,
      totalEarned: affiliate.totalEarned,
      paidOut: affiliate.paidOut,
      active: affiliate.active,
    };
    const row = await this.prisma.affiliate.upsert({
      where: { id: affiliate.id },
      create: { id: affiliate.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaAffiliate): Affiliate {
    return Affiliate.create(
      {
        tenantId: row.tenantId,
        userId: row.userId,
        code: row.code,
        commissionPct: row.commissionPct,
        totalEarned: row.totalEarned,
        paidOut: row.paidOut,
        active: row.active,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
