import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { CommandRegistry, SlashCommand } from '../command-registry';
import { TenantResolverService } from '../tenant-resolver.service';
import { EnsureUserUseCase } from '@application/use-cases/user/ensure-user.usecase';
import { IWalletRepository, WALLET_REPOSITORY } from '@domain/wallet/wallet.repository';

@Injectable()
export class PerfilCommand implements SlashCommand, OnModuleInit {
  data = new SlashCommandBuilder().setName('perfil').setDescription('Seu perfil, XP e carteira');

  constructor(
    private readonly registry: CommandRegistry,
    private readonly tenantResolver: TenantResolverService,
    private readonly ensureUser: EnsureUserUseCase,
    @Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository,
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
    const user = await this.ensureUser.execute({
      tenantId: tenant.id,
      discordId: interaction.user.id,
      username: interaction.user.username,
    });
    const wallet = await this.wallets.findByUserId(user.id);
    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${user.username}`)
      .setColor(0x5865f2)
      .addFields(
        { name: 'Nível', value: String(user.level), inline: true },
        { name: 'XP', value: String(user.xp), inline: true },
        { name: 'Streak', value: String(user.streak), inline: true },
        { name: 'Trust score', value: String(user.trustScore.toFixed(0)), inline: true },
        { name: 'Carteira', value: wallet?.balance.format() ?? 'R$ 0,00', inline: true },
        { name: 'Segmento', value: user.segment ?? '—', inline: true },
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
