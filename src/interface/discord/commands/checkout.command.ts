import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { EnsureUserUseCase } from '@application/use-cases/user/ensure-user.usecase';
import { CheckoutUseCase } from '@application/use-cases/checkout/checkout.usecase';
import { orderEmbed, paymentActions } from '../embeds';

@Injectable()
export class CheckoutCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder()
    .setName('checkout')
    .setDescription('Finaliza a compra do seu carrinho')
    .addStringOption((o) =>
      o.setName('afiliado').setDescription('Código de afiliado').setRequired(false),
    );

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly ensureUser: EnsureUserUseCase,
    private readonly checkoutUC: CheckoutUseCase,
  ) {}

  onModuleInit(): void {
    this.registry.registerCommand(this);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'Use dentro de um servidor.', ephemeral: true });
      return;
    }
    const tenant = await this.tenantResolver.resolveOrCreate(
      interaction.guildId,
      interaction.guild?.name ?? 'Server',
    );
    const user = await this.ensureUser.execute({
      tenantId: tenant.id,
      discordId: interaction.user.id,
      username: interaction.user.username,
    });
    await interaction.deferReply({ ephemeral: true });

    try {
      const { order, payment } = await this.checkoutUC.execute({
        tenantId: tenant.id,
        userId: user.id,
        affiliateCode: interaction.options.getString('afiliado') ?? undefined,
      });
      await interaction.editReply({
        embeds: [orderEmbed(order, payment)],
        components: [paymentActions(payment)],
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ ${(err as Error).message}` });
    }
  }
}
