import { Money } from '@shared/domain';

export interface PaymentChargeRequest {
  paymentId: string;
  userId: string;
  amount: Money;
  description?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentChargeResponse {
  externalId: string;
  pixCode: string;
  qrCodeData: string;
  expiresAt: Date;
}

export interface IPaymentGateway {
  charge(req: PaymentChargeRequest): Promise<PaymentChargeResponse>;
  verifyStatus(externalId: string): Promise<'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'>;
  simulateApproval(externalId: string): Promise<void>;
}

export const PAYMENT_GATEWAY = Symbol('IPaymentGateway');
