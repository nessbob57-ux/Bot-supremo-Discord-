import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '@domain/cart/cart.aggregate';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly carts: ICartRepository) {}

  async execute(userId: string, productId: string): Promise<Cart> {
    const cart = await this.carts.findActiveByUser(userId);
    if (!cart) throw new NotFoundError('Cart');
    cart.removeItem(productId);
    return this.carts.save(cart);
  }
}
