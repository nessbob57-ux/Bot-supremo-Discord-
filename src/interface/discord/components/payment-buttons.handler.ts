import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ButtonInteraction } from 'discord.js';
import { CommandRegistry } from '../command-registry';
import { ConfirmPaymentUseCase } from '@application/use-cases/payment/confirm-payment.usecase';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { IPaymentGateway, PAYMENT_GATEWAY } from '@domain/payment/payment.gateway';

@Injectable()
export class PaymentButtonsHandler implements OnModuleInit {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly confirm: ConfirmPaymentUseCase,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: IPaymentGateway,
  ) {}

  onModuleInit(): void {
    this.registry.registerButton('payment_check', async (interaction) =>
      this.handleCheck(interaction),
    );
    this.registry.registerButton('payment_simulate', async (interaction) =>
      this.handleSimulate(interaction),
    );
  }

  private async handleCheck(interaction: ButtonInteraction): Promise<void> {
    const paymentId = interaction.customId.split(':')[1];
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      await interaction.reply({ content: '❌ Pagamento não encontrado.', ephemeral: true });
      return;
    }
    if (payment.status === 'APPROVED') {
      await interaction.reply({ content: '✅ Pagamento já aprovado!', ephemeral: true });
      return;
    }
    if (payment.externalId) {
      const status = await this.gateway.verifyStatus(payment.externalId);
      if (status === 'APPROVED') {
        await this.confirm.execute(paymentId);
        await interaction.reply({ content: '🎉 Pagamento confirmado!', ephemeral: true });
        return;
      }
    }
    await interaction.reply({ content: '⏳ Ainda aguardando confirmação.', ephemeral: true });
  }

  private async handleSimulate(interaction: ButtonInteraction): Promise<void> {
    const paymentId = interaction.customId.split(':')[1];
    const payment = await this.payments.findById(paymentId);
    if (!payment?.externalId) {
      await interaction.reply({ content: '❌ Pagamento sem id externo.', ephemeral: true });
      return;
    }
    await this.gateway.simulateApproval(payment.externalId);
    await this.confirm.execute(paymentId);
    await interaction.reply({ content: '🧪 Pagamento simulado e aprovado.', ephemeral: true });
  }
}
