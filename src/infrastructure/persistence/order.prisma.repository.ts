import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Order, OrderStatus } from '@domain/order/order.aggregate';
import { IOrderRepository } from '@domain/order/order.repository';
import { Money } from '@shared/domain';

@Injectable()
export class OrderPrismaRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? this.toDomain(row) : null;
  }

  async findByNumber(tenantId: string, number: number): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { tenantId_number: { tenantId, number } },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUser(userId: string, limit = 20): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async nextOrderNumber(tenantId: string): Promise<number> {
    const last = await this.prisma.order.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return (last?.number ?? 0) + 1;
  }

  async countByTenantInRange(
    tenantId: string,
    from: Date,
    to: Date,
    status?: OrderStatus,
  ): Promise<number> {
    return this.prisma.order.count({
      where: {
        tenantId,
        createdAt: { gte: from, lt: to },
        ...(status ? { status } : {}),
      },
    });
  }

  async revenueByTenantInRange(tenantId: string, from: Date, to: Date): Promise<number> {
    const agg = await this.prisma.order.aggregate({
      where: {
        tenantId,
        status: { in: ['PAID', 'DELIVERED'] },
        createdAt: { gte: from, lt: to },
      },
      _sum: { totalCents: true },
    });
    return agg._sum.totalCents ?? 0;
  }

  async save(order: Order): Promise<Order> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          tenantId: order.tenantId,
          userId: order.userId,
          number: order.number,
          status: order.status,
          totalCents: order.total.amountCents,
          subtotalCents: order.subtotal.amountCents,
          discountCents: order.discount.amountCents,
          taxCents: order.tax.amountCents,
          couponCode: order.couponCode ?? null,
          affiliateId: order.affiliateId ?? null,
          notes: order.notes ?? null,
          metadata: order.metadata as object,
        },
        update: {
          status: order.status,
          totalCents: order.total.amountCents,
          subtotalCents: order.subtotal.amountCents,
          discountCents: order.discount.amountCents,
          taxCents: order.tax.amountCents,
          notes: order.notes ?? null,
        },
      });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      if (order.items.length > 0) {
        await tx.orderItem.createMany({
          data: order.items.map((it) => ({
            orderId: order.id,
            productId: it.productId,
            productName: it.productName,
            quantity: it.quantity,
            priceCents: it.price.amountCents,
            totalCents: it.total.amountCents,
          })),
        });
      }
    });
    return order;
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    userId: string;
    number: number;
    status: string;
    totalCents: number;
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    couponCode: string | null;
    affiliateId: string | null;
    notes: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      priceCents: number;
      totalCents: number;
    }[];
  }): Order {
    return Order.create(
      {
        tenantId: row.tenantId,
        userId: row.userId,
        number: row.number,
        status: row.status as OrderStatus,
        items: row.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: Money.create(it.priceCents),
          total: Money.create(it.totalCents),
        })),
        discount: Money.create(row.discountCents),
        tax: Money.create(row.taxCents),
        couponCode: row.couponCode ?? undefined,
        affiliateId: row.affiliateId ?? undefined,
        notes: row.notes ?? undefined,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
