import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '@domain/payment/payment.gateway';
import { MockPixGateway } from './mock-pix.gateway';

@Module({
  providers: [{ provide: PAYMENT_GATEWAY, useClass: MockPixGateway }],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsInfraModule {}
