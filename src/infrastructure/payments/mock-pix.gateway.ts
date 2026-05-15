import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  IPaymentGateway,
  PaymentChargeRequest,
  PaymentChargeResponse,
} from '@domain/payment/payment.gateway';

/**
 * Mock PIX gateway — gera códigos PIX e QR Code falsos para sandbox/dev.
 * Em produção, substituir por integração com banco real ou Mercado Pago/Asaas/Stripe.
 */
@Injectable()
export class MockPixGateway implements IPaymentGateway {
  private readonly logger = new Logger(MockPixGateway.name);
  private readonly approvalState = new Map<
    string,
    'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  >();

  async charge(req: PaymentChargeRequest): Promise<PaymentChargeResponse> {
    const externalId = `mock_${randomBytes(8).toString('hex')}`;
    const expiresAt = req.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000);
    const pixCode = this.generatePixCopiaECola(req.amount.amount, externalId);
    const qrCodeData = pixCode; // For real integrations, generate QR image data URL separately
    this.approvalState.set(externalId, 'PENDING');
    this.logger.log(`PIX charge created: external=${externalId} amount=${req.amount.format()}`);
    return { externalId, pixCode, qrCodeData, expiresAt };
  }

  async verifyStatus(externalId: string): Promise<'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'> {
    return this.approvalState.get(externalId) ?? 'PENDING';
  }

  async simulateApproval(externalId: string): Promise<void> {
    this.approvalState.set(externalId, 'APPROVED');
    this.logger.log(`PIX manually approved: ${externalId}`);
  }

  private generatePixCopiaECola(amount: number, txid: string): string {
    // Faux EMVCo BR Code structure — not valid for real banks, only for dev/demo.
    const fixedAmount = amount.toFixed(2);
    return [
      '00020126',
      '5204000053039865802BR5913BotSupremoLtd',
      `6009Sao Paulo`,
      `54${String(fixedAmount.length).padStart(2, '0')}${fixedAmount}`,
      `62${String(txid.length + 4).padStart(2, '0')}05${String(txid.length).padStart(2, '0')}${txid}`,
      '6304ABCD',
    ].join('');
  }
}
