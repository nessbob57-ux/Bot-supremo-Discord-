import { Inject, Injectable } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '@domain/order/order.repository';

export interface FinancialSummary {
  tenantId: string;
  range: { from: Date; to: Date };
  totalOrders: number;
  paidOrders: number;
  revenueCents: number;
  averageTicketCents: number;
}

@Injectable()
export class FinancialSummaryUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: IOrderRepository) {}

  async execute(tenantId: string, from: Date, to: Date): Promise<FinancialSummary> {
    const [totalOrders, paidOrders, revenue] = await Promise.all([
      this.orders.countByTenantInRange(tenantId, from, to),
      this.orders.countByTenantInRange(tenantId, from, to, 'PAID'),
      this.orders.revenueByTenantInRange(tenantId, from, to),
    ]);
    return {
      tenantId,
      range: { from, to },
      totalOrders,
      paidOrders,
      revenueCents: revenue,
      averageTicketCents: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
    };
  }
}
