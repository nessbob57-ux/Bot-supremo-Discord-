import { Body, Controller, Headers, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfirmPaymentUseCase } from '@application/use-cases/payment/confirm-payment.usecase';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { Inject } from '@nestjs/common';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly confirm: ConfirmPaymentUseCase,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
  ) {}

  @Post('payments')
  async paymentWebhook(
    @Headers('x-webhook-signature') signature: string | undefined,
    @Body() body: { externalId: string; status: 'APPROVED' | 'REJECTED' | 'EXPIRED' },
  ) {
    this.verifySignature(signature, body);

    const payment = await this.payments.findByExternalId(body.externalId);
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
    if (body.status === 'APPROVED') {
      await this.confirm.execute(payment.id);
    } else if (body.status === 'REJECTED') {
      payment.reject('Webhook rejection');
      await this.payments.save(payment);
    } else if (body.status === 'EXPIRED') {
      payment.expire();
      await this.payments.save(payment);
    }
    this.logger.log(`Webhook processed: payment=${payment.id} status=${body.status}`);
    return { ok: true };
  }

  private verifySignature(signature: string | undefined, body: unknown): void {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret || secret === 'change_me_in_production') return; // dev-mode skip
    if (!signature) throw new HttpException('Missing signature', HttpStatus.UNAUTHORIZED);
    const expected = createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }
  }
}
