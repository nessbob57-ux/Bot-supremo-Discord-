import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cart } from '@domain/cart/cart.aggregate';
import { ICartRepository } from '@domain/cart/cart.repository';
import { Money } from '@shared/domain';

@Injectable()
export class CartPrismaRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({ where: { id }, include: { items: true } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByUser(userId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAbandonedOlderThan(date: Date): Promise<Cart[]> {
    const rows = await this.prisma.cart.findMany({
      where: { status: 'ACTIVE', updatedAt: { lt: date } },
      include: { items: true },
      take: 200,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(cart: Cart): Promise<Cart> {
    await this.prisma.$transaction(async (tx) => {
      await tx.cart.upsert({
        where: { id: cart.id },
        create: {
          id: cart.id,
          userId: cart.userId,
          status: cart.status,
          couponId: cart.couponId ?? null,
        },
        update: {
          status: cart.status,
          couponId: cart.couponId ?? null,
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (cart.items.length > 0) {
        await tx.cartItem.createMany({
          data: cart.items.map((it) => ({
            cartId: cart.id,
            productId: it.productId,
            quantity: it.quantity,
            priceCents: it.price.amountCents,
          })),
        });
      }
    });
    return cart;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cart.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    userId: string;
    status: string;
    couponId: string | null;
    items: { productId: string; quantity: number; priceCents: number }[];
    createdAt: Date;
    updatedAt: Date;
  }): Cart {
    return Cart.create(
      {
        userId: row.userId,
        status: row.status as Cart['status'],
        couponId: row.couponId ?? undefined,
        items: row.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          price: Money.create(it.priceCents),
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
