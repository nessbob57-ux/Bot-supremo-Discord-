import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Wallet } from '@domain/wallet/wallet.aggregate';
import { IWalletRepository } from '@domain/wallet/wallet.repository';
import { Money } from '@shared/domain';

@Injectable()
export class WalletPrismaRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Wallet | null> {
    const row = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!row) return null;
    return Wallet.create(
      {
        userId: row.userId,
        balance: Money.create(row.balanceCents, row.currency),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  async save(wallet: Wallet): Promise<Wallet> {
    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { id: wallet.id },
        create: {
          id: wallet.id,
          userId: wallet.userId,
          balanceCents: wallet.balance.amountCents,
          currency: wallet.balance.currency,
        },
        update: {
          balanceCents: wallet.balance.amountCents,
          currency: wallet.balance.currency,
        },
      });
      const lastMovement = wallet.movements[wallet.movements.length - 1];
      if (lastMovement) {
        await tx.walletMovement.create({
          data: {
            walletId: wallet.id,
            amountCents: lastMovement.amount.amountCents,
            type: lastMovement.type,
            description: lastMovement.description ?? null,
          },
        });
      }
    });
    return wallet;
  }
}
