import { Inject, Injectable } from '@nestjs/common';
import { Money } from '@shared/domain';
import { Product, ProductType, DeliveryMode } from '@domain/product/product.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/product/product.repository';

export interface CreateProductInput {
  tenantId: string;
  name: string;
  slug: string;
  priceCents: number;
  currency?: string;
  shortDesc?: string;
  longDesc?: string;
  type?: ProductType;
  stock?: number;
  unlimited?: boolean;
  isFree?: boolean;
  isRecurring?: boolean;
  featured?: boolean;
  hidden?: boolean;
  images?: string[];
  tags?: string[];
  categoryId?: string;
  deliveryMode?: DeliveryMode;
  maxPerUser?: number;
  minPerUser?: number;
}

@Injectable()
export class CreateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const product = Product.create({
      tenantId: input.tenantId,
      name: input.name,
      slug: input.slug,
      price: Money.create(input.priceCents, input.currency ?? 'BRL'),
      shortDesc: input.shortDesc,
      longDesc: input.longDesc,
      type: input.type ?? 'DIGITAL',
      stock: input.stock ?? 0,
      unlimited: input.unlimited ?? false,
      isFree: input.isFree ?? false,
      isRecurring: input.isRecurring ?? false,
      featured: input.featured ?? false,
      hidden: input.hidden ?? false,
      images: input.images ?? [],
      tags: input.tags ?? [],
      categoryId: input.categoryId,
      deliveryMode: input.deliveryMode ?? 'AUTOMATIC',
      maxPerUser: input.maxPerUser,
      minPerUser: input.minPerUser ?? 1,
    });
    return this.products.save(product);
  }
}
