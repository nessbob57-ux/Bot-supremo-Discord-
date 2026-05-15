import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { FinancialSummaryUseCase } from '@application/use-cases/analytics/financial-summary.usecase';

@Injectable()
export class FinanceiroCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder()
    .setName('financeiro')
    .setDescription('Relatório financeiro do servidor (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName('periodo')
        .setDescription('Período')
        .addChoices(
          { name: 'Diário', value: 'day' },
          { name: 'Semanal', value: 'week' },
          { name: 'Mensal', value: 'month' },
        )
        .setRequired(false),
    );

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly summaryUC: FinancialSummaryUseCase,
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
    const period = interaction.options.getString('periodo') ?? 'month';
    const to = new Date();
    const from = new Date(to);
    if (period === 'day') from.setDate(from.getDate() - 1);
    else if (period === 'week') from.setDate(from.getDate() - 7);
    else from.setMonth(from.getMonth() - 1);

    await interaction.deferReply({ ephemeral: true });
    const summary = await this.summaryUC.execute(tenant.id, from, to);
    const embed = new EmbedBuilder()
      .setTitle(`Resumo financeiro — ${period}`)
      .setColor(0x57f287)
      .addFields(
        {
          name: 'Receita',
          value: (summary.revenueCents / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          inline: true,
        },
        { name: 'Pedidos pagos', value: String(summary.paidOrders), inline: true },
        { name: 'Pedidos totais', value: String(summary.totalOrders), inline: true },
        {
          name: 'Ticket médio',
          value: (summary.averageTicketCents / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          inline: true,
        },
      );
    await interaction.editReply({ embeds: [embed] });
  }
}
