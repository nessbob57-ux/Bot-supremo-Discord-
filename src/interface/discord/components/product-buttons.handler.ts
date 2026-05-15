import { Injectable, OnModuleInit } from '@nestjs/common';
import { ButtonInteraction } from 'discord.js';
import { CommandRegistry } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { EnsureUserUseCase } from '@application/use-cases/user/ensure-user.usecase';
import { AddToCartUseCase } from '@application/use-cases/cart/add-to-cart.usecase';

@Injectable()
export class ProductButtonsHandler implements OnModuleInit {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly ensureUser: EnsureUserUseCase,
    private readonly addToCart: AddToCartUseCase,
  ) {}

  onModuleInit(): void {
    this.registry.registerButton('product_buy', async (interaction) => this.handleBuy(interaction));
    this.registry.registerButton('product_wishlist', async (interaction) =>
      this.handleWishlist(interaction),
    );
  }

  private async handleBuy(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.guildId) return;
    const productId = interaction.customId.split(':')[1];
    const tenant = await this.tenantResolver.resolveOrCreate(
      interaction.guildId,
      interaction.guild?.name ?? 'Server',
    );
    const user = await this.ensureUser.execute({
      tenantId: tenant.id,
      discordId: interaction.user.id,
      username: interaction.user.username,
    });
    try {
      await this.addToCart.execute({ userId: user.id, productId, quantity: 1 });
      await interaction.reply({
        content: '✅ Item adicionado ao carrinho. Use `/checkout` para finalizar a compra.',
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({ content: `❌ ${(err as Error).message}`, ephemeral: true });
    }
  }

  private async handleWishlist(interaction: ButtonInteraction): Promise<void> {
    await interaction.reply({ content: '⭐ Adicionado à sua lista (wishlist).', ephemeral: true });
  }
}
