import { Product } from './product.entity';

export interface ProductSearchFilters {
  tenantId: string;
  query?: string;
  categoryId?: string;
  tags?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  featured?: boolean;
  active?: boolean;
  hidden?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'popular' | 'newest';
  limit?: number;
  offset?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(tenantId: string, slug: string): Promise<Product | null>;
  search(filters: ProductSearchFilters): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
  topSellers(tenantId: string, limit: number): Promise<Product[]>;
  related(productId: string, limit: number): Promise<Product[]>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
