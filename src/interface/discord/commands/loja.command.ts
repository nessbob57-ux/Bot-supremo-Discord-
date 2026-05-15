import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { SearchProductsUseCase } from '@application/use-cases/product/search-products.usecase';
import { productEmbed, productActions } from '../embeds';

@Injectable()
export class LojaCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder()
    .setName('loja')
    .setDescription('Mostra produtos disponíveis na loja')
    .addStringOption((o) => o.setName('busca').setDescription('Texto de busca').setRequired(false))
    .addStringOption((o) =>
      o
        .setName('ordenar')
        .setDescription('Ordenação')
        .addChoices(
          { name: 'Populares', value: 'popular' },
          { name: 'Preço crescente', value: 'price_asc' },
          { name: 'Preço decrescente', value: 'price_desc' },
          { name: 'Mais novos', value: 'newest' },
        )
        .setRequired(false),
    );

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  onModuleInit(): void {
    this.registry.registerCommand(this);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }
    const tenant = await this.tenantResolver.resolveOrCreate(
      interaction.guildId,
      interaction.guild?.name ?? 'Discord Server',
    );
    const query = interaction.options.getString('busca') ?? undefined;
    const sort =
      (interaction.options.getString('ordenar') as
        | 'popular'
        | 'price_asc'
        | 'price_desc'
        | 'newest'
        | null) ?? 'popular';

    await interaction.deferReply({ ephemeral: true });
    const products = await this.searchProducts.execute({
      tenantId: tenant.id,
      query,
      sort,
      limit: 10,
    });

    if (products.length === 0) {
      await interaction.editReply({ content: '🛒 Nenhum produto encontrado.' });
      return;
    }

    const embeds = products.slice(0, 5).map((p) => productEmbed(p));
    const components = products.slice(0, 5).map((p) => productActions(p));
    await interaction.editReply({ embeds, components });
  }
}
