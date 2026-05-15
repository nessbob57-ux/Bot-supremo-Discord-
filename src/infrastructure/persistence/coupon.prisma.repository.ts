import { Injectable } from '@nestjs/common';
import type { Coupon as PrismaCoupon } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Coupon, CouponType } from '@domain/coupon/coupon.entity';
import { ICouponRepository } from '@domain/coupon/coupon.repository';

@Injectable()
export class CouponPrismaRepository implements ICouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<Coupon | null> {
    const row = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: code.toUpperCase() } },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(coupon: Coupon): Promise<Coupon> {
    const data = {
      tenantId: coupon.tenantId,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderCents: coupon.minOrderCents,
      maxUses: coupon.maxUses ?? null,
      uses: coupon.uses,
      expiresAt: coupon.expiresAt ?? null,
      active: coupon.active,
    };
    const row = await this.prisma.coupon.upsert({
      where: { id: coupon.id },
      create: { id: coupon.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaCoupon): Coupon {
    return Coupon.create(
      {
        tenantId: row.tenantId,
        code: row.code,
        type: row.type as CouponType,
        value: row.value,
        minOrderCents: row.minOrderCents,
        maxUses: row.maxUses ?? undefined,
        uses: row.uses,
        startsAt: row.startsAt ?? undefined,
        expiresAt: row.expiresAt ?? undefined,
        active: row.active,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
