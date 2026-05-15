import { Injectable } from '@nestjs/common';
import type { Product as PrismaProduct, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Money } from '@shared/domain';
import { Product } from '@domain/product/product.entity';
import { IProductRepository, ProductSearchFilters } from '@domain/product/product.repository';

@Injectable()
export class ProductPrismaRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(tenantId: string, slug: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    return row ? this.toDomain(row) : null;
  }

  async search(filters: ProductSearchFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { tenantId: filters.tenantId };
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { shortDesc: { contains: filters.query, mode: 'insensitive' } },
        { tags: { has: filters.query } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.hidden !== undefined) where.hidden = filters.hidden;
    if (filters.tags?.length) where.tags = { hasSome: filters.tags };
    if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
      where.priceCents = {
        ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
        ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
      };
    }
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (filters.sort) {
      case 'price_asc':
        orderBy = { priceCents: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceCents: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
      default:
        orderBy = { featured: 'desc' };
    }
    const rows = await this.prisma.product.findMany({
      where,
      orderBy,
      take: filters.limit ?? 25,
      skip: filters.offset ?? 0,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(product: Product): Promise<Product> {
    const data: Prisma.ProductUncheckedCreateInput = {
      id: product.id,
      tenantId: product.tenantId,
      categoryId: product.categoryId ?? null,
      name: product.name,
      slug: product.slug,
      shortDesc: product.shortDesc ?? null,
      longDesc: product.longDesc ?? null,
      type: product.type,
      priceCents: product.price.amountCents,
      compareAtCents: product.compareAt?.amountCents ?? null,
      currency: product.price.currency,
      stock: product.stock,
      unlimited: product.unlimited,
      minPerUser: product.minPerUser,
      maxPerUser: product.maxPerUser ?? null,
      hidden: product.hidden,
      exclusive: product.exclusive,
      featured: product.featured,
      isFree: product.isFree,
      isRecurring: product.isRecurring,
      isBundle: product.isBundle,
      isSecret: product.isSecret,
      isPreorder: product.isPreorder,
      deliveryMode: product.deliveryMode,
      images: product.images,
      tags: product.tags,
      active: product.active,
    };
    const row = await this.prisma.product.upsert({
      where: { id: product.id },
      create: data,
      update: data,
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async topSellers(tenantId: string, limit: number): Promise<Product[]> {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { order: { tenantId, status: { in: ['PAID', 'DELIVERED'] } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    const ids = grouped.map((g) => g.productId);
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({ where: { id: { in: ids } } });
    return rows.map((r) => this.toDomain(r));
  }

  async related(productId: string, limit: number): Promise<Product[]> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return [];
    const rows = await this.prisma.product.findMany({
      where: {
        tenantId: product.tenantId,
        id: { not: productId },
        OR: [{ categoryId: product.categoryId }, { tags: { hasSome: product.tags } }],
        active: true,
        hidden: false,
      },
      take: limit,
    });
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: PrismaProduct): Product {
    return Product.create(
      {
        tenantId: row.tenantId,
        categoryId: row.categoryId ?? undefined,
        name: row.name,
        slug: row.slug,
        sku: row.sku ?? undefined,
        shortDesc: row.shortDesc ?? undefined,
        longDesc: row.longDesc ?? undefined,
        type: row.type as Product['type'],
        price: Money.create(row.priceCents, row.currency),
        compareAt:
          row.compareAtCents != null ? Money.create(row.compareAtCents, row.currency) : undefined,
        stock: row.stock,
        unlimited: row.unlimited,
        minPerUser: row.minPerUser,
        maxPerUser: row.maxPerUser ?? undefined,
        hidden: row.hidden,
        exclusive: row.exclusive,
        featured: row.featured,
        isFree: row.isFree,
        isRecurring: row.isRecurring,
        isBundle: row.isBundle,
        isSecret: row.isSecret,
        isPreorder: row.isPreorder,
        deliveryMode: row.deliveryMode as Product['deliveryMode'],
        images: row.images,
        tags: row.tags,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        active: row.active,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
