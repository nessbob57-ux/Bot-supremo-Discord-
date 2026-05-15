import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { EnsureUserUseCase } from '@application/use-cases/user/ensure-user.usecase';
import { ICartRepository, CART_REPOSITORY } from '@domain/cart/cart.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '@domain/product/product.repository';

@Injectable()
export class CarrinhoCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder().setName('carrinho').setDescription('Visualiza seu carrinho');

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly ensureUser: EnsureUserUseCase,
    @Inject(CART_REPOSITORY) private readonly carts: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
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

    const cart = await this.carts.findActiveByUser(user.id);
    if (!cart || cart.isEmpty) {
      await interaction.editReply({ content: '🛒 Carrinho vazio.' });
      return;
    }

    const lines: string[] = [];
    for (const item of cart.items) {
      const product = await this.products.findById(item.productId);
      lines.push(
        `• ${item.quantity}x **${product?.name ?? item.productId}** — ${item.price.multiply(item.quantity).format()}`,
      );
    }
    const embed = new EmbedBuilder()
      .setTitle('Seu carrinho')
      .setColor(0x5865f2)
      .setDescription(lines.join('\n'))
      .addFields({ name: 'Subtotal', value: cart.subtotal().format(), inline: true });

    await interaction.editReply({ embeds: [embed] });
  }
}
