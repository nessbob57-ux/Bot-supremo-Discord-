import { Cart } from './cart.aggregate';

export interface ICartRepository {
  findById(id: string): Promise<Cart | null>;
  findActiveByUser(userId: string): Promise<Cart | null>;
  findAbandonedOlderThan(date: Date): Promise<Cart[]>;
  save(cart: Cart): Promise<Cart>;
  delete(id: string): Promise<void>;
}

export const CART_REPOSITORY = Symbol('ICartRepository');
