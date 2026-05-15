import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProductUseCase } from '@application/use-cases/product/create-product.usecase';
import { SearchProductsUseCase } from '@application/use-cases/product/search-products.usecase';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      tenantId: string;
      name: string;
      slug: string;
      priceCents: number;
      shortDesc?: string;
    },
  ) {
    const product = await this.createProduct.execute(body);
    return product.toJSON();
  }

  @Get()
  async list(@Query('tenantId') tenantId: string, @Query('q') q?: string) {
    if (!tenantId) return [];
    const products = await this.searchProducts.execute({ tenantId, query: q, limit: 50 });
    return products.map((p) => p.toJSON());
  }
}
