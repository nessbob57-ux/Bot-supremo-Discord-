import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '@domain/cart/cart.aggregate';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/product/product.repository';
import { BusinessRuleError, NotFoundError } from '@shared/errors/domain.errors';

export interface AddToCartInput {
  userId: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
  ) {}

  async execute(input: AddToCartInput): Promise<Cart> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError('Product', input.productId);
    if (!product.canBeSold(input.quantity)) {
      throw new BusinessRuleError('Product not available or out of stock');
    }
    if (product.maxPerUser && input.quantity > product.maxPerUser) {
      throw new BusinessRuleError(`Max per user is ${product.maxPerUser}`);
    }

    let cart = await this.carts.findActiveByUser(input.userId);
    if (!cart) cart = Cart.create({ userId: input.userId });
    cart.addItem(product.id, input.quantity, product.price);
    return this.carts.save(cart);
  }
}
