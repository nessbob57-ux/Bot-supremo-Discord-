import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { CreateProductUseCase } from '@application/use-cases/product/create-product.usecase';

@Injectable()
export class AdminProductCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder()
    .setName('admin-produto')
    .setDescription('Administra produtos (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('criar')
        .setDescription('Cria um novo produto')
        .addStringOption((o) =>
          o.setName('nome').setDescription('Nome do produto').setRequired(true),
        )
        .addIntegerOption((o) =>
          o.setName('preco_centavos').setDescription('Preço em centavos').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('descricao').setDescription('Descrição curta').setRequired(false),
        )
        .addIntegerOption((o) =>
          o.setName('estoque').setDescription('Estoque inicial').setRequired(false),
        )
        .addBooleanOption((o) =>
          o.setName('ilimitado').setDescription('Estoque ilimitado').setRequired(false),
        )
        .addBooleanOption((o) =>
          o.setName('destaque').setDescription('Destacar no topo').setRequired(false),
        ),
    );

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly createProduct: CreateProductUseCase,
  ) {}

  onModuleInit(): void {
    this.registry.registerCommand(this);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) return;
    const tenant = await this.tenantResolver.resolveOrCreate(
      interaction.guildId,
      interaction.guild?.name ?? 'Server',
    );
    const sub = interaction.options.getSubcommand();
    if (sub === 'criar') {
      const name = interaction.options.getString('nome', true);
      const priceCents = interaction.options.getInteger('preco_centavos', true);
      const desc = interaction.options.getString('descricao') ?? undefined;
      const stock = interaction.options.getInteger('estoque') ?? 0;
      const unlimited = interaction.options.getBoolean('ilimitado') ?? false;
      const featured = interaction.options.getBoolean('destaque') ?? false;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
      const product = await this.createProduct.execute({
        tenantId: tenant.id,
        name,
        slug,
        priceCents,
        shortDesc: desc,
        stock,
        unlimited,
        featured,
      });
      await interaction.reply({
        content: `✅ Produto criado: **${product.name}** — ${product.price.format()} (id: \`${product.id}\`)`,
        ephemeral: true,
      });
    }
  }
}
