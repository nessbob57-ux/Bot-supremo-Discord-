import { Injectable } from '@nestjs/common';
import type { Payment as PrismaPayment } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Payment, PaymentMethod, PaymentStatus } from '@domain/payment/payment.aggregate';
import { IPaymentRepository } from '@domain/payment/payment.repository';
import { Money } from '@shared/domain';

@Injectable()
export class PaymentPrismaRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findFirst({ where: { externalId } });
    return row ? this.toDomain(row) : null;
  }

  async findPendingExpiredBefore(date: Date): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] }, expiresAt: { lt: date } },
      take: 200,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({ where: { orderId } });
    return rows.map((r) => this.toDomain(r));
  }

  async save(payment: Payment): Promise<Payment> {
    const data = {
      orderId: payment.orderId ?? null,
      userId: payment.userId,
      amountCents: payment.amount.amountCents,
      currency: payment.amount.currency,
      method: payment.method,
      status: payment.status,
      externalId: payment.externalId ?? null,
      pixCode: payment.pixCode ?? null,
      qrCodeData: payment.qrCodeData ?? null,
      attempts: payment.attempts,
      failureReason: payment.failureReason ?? null,
      expiresAt: payment.expiresAt ?? null,
      paidAt: payment.paidAt ?? null,
      metadata: payment.metadata as object,
    };
    const row = await this.prisma.payment.upsert({
      where: { id: payment.id },
      create: { id: payment.id, ...data },
      update: data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaPayment): Payment {
    return Payment.create(
      {
        orderId: row.orderId ?? undefined,
        userId: row.userId,
        amount: Money.create(row.amountCents, row.currency),
        method: row.method as PaymentMethod,
        status: row.status as PaymentStatus,
        externalId: row.externalId ?? undefined,
        pixCode: row.pixCode ?? undefined,
        qrCodeData: row.qrCodeData ?? undefined,
        attempts: row.attempts,
        failureReason: row.failureReason ?? undefined,
        expiresAt: row.expiresAt ?? undefined,
        paidAt: row.paidAt ?? undefined,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
