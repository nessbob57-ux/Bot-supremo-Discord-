import { Inject, Injectable } from '@nestjs/common';
import { Product } from '@domain/product/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
  ProductSearchFilters,
} from '@domain/product/product.repository';

@Injectable()
export class SearchProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository) {}

  async execute(filters: ProductSearchFilters): Promise<Product[]> {
    return this.products.search({
      ...filters,
      active: filters.active ?? true,
      hidden: filters.hidden ?? false,
    });
  }
}
