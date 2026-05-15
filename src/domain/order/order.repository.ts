import { Order, OrderStatus } from './order.aggregate';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByNumber(tenantId: string, number: number): Promise<Order | null>;
  findByUser(userId: string, limit?: number): Promise<Order[]>;
  nextOrderNumber(tenantId: string): Promise<number>;
  countByTenantInRange(
    tenantId: string,
    from: Date,
    to: Date,
    status?: OrderStatus,
  ): Promise<number>;
  revenueByTenantInRange(tenantId: string, from: Date, to: Date): Promise<number>;
  save(order: Order): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
