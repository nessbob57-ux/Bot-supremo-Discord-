import { Payment } from './payment.aggregate';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByExternalId(externalId: string): Promise<Payment | null>;
  findPendingExpiredBefore(date: Date): Promise<Payment[]>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<Payment>;
}

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
