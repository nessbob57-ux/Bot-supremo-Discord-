import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { User } from '@domain/user/user.entity';
import { IUserRepository } from '@domain/user/user.repository';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByDiscordId(tenantId: string, discordId: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { tenantId_discordId: { tenantId, discordId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findManyBySegment(tenantId: string, segment: string): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ where: { tenantId, segment } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(user: User): Promise<User> {
    const data = {
      tenantId: user.tenantId,
      discordId: user.discordId,
      username: user.username,
      email: user.email ?? null,
      trustScore: user.trustScore,
      isBanned: user.isBanned,
      isAdmin: user.isAdmin,
      language: user.language,
      segment: user.segment ?? null,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      consentLGPD: user.consentLGPD,
    };
    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(row: PrismaUser): User {
    return User.create(
      {
        tenantId: row.tenantId,
        discordId: row.discordId,
        username: row.username,
        email: row.email ?? undefined,
        trustScore: row.trustScore,
        isBanned: row.isBanned,
        isAdmin: row.isAdmin,
        language: row.language,
        segment: row.segment ?? undefined,
        xp: row.xp,
        level: row.level,
        streak: row.streak,
        consentLGPD: row.consentLGPD,
        lastActiveAt: row.lastActiveAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
