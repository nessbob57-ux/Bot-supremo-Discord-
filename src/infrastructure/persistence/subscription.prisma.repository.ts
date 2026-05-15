import { Injectable } from '@nestjs/common';
import type { Subscription as PrismaSubscription } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Subscription, SubscriptionStatus } from '@domain/subscription/subscription.aggregate';
import { ISubscriptionRepository } from '@domain/subscription/subscription.repository';

@Injectable()
export class SubscriptionPrismaRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUser(userId: string): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { userId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findDueForRenewal(before: Date): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', renewsAt: { lt: before } },
      take: 200,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(sub: Subscription): Promise<Subscription> {
    const data = {
      tenantId: sub.tenantId,
      userId: sub.userId,
      planId: sub.planId,
      status: sub.status,
      renewsAt: sub.renewsAt ?? null,
      trialEndsAt: sub.trialEndsAt ?? null,
      expiresAt: sub.expiresAt ?? null,
      failedAttempts: sub.failedAttempts,
    };
    const row = await this.prisma.subscription.upsert({
      where: { id: sub.id },
      create: { id: sub.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaSubscription): Subscription {
    return Subscription.create(
      {
        tenantId: row.tenantId,
        userId: row.userId,
        planId: row.planId,
        status: row.status as SubscriptionStatus,
        startedAt: row.startedAt,
        trialEndsAt: row.trialEndsAt ?? undefined,
        renewsAt: row.renewsAt ?? undefined,
        cancelledAt: row.cancelledAt ?? undefined,
        pausedAt: row.pausedAt ?? undefined,
        expiresAt: row.expiresAt ?? undefined,
        failedAttempts: row.failedAttempts,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
