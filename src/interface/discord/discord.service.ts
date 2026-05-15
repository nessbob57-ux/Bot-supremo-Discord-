import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Partials, REST, Routes, Interaction, Events } from 'discord.js';
import { CommandRegistry } from './command-registry';

@Injectable()
export class DiscordService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  public client?: Client;

  constructor(
    private readonly config: ConfigService,
    private readonly registry: CommandRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.config.get<string>('DISCORD_TOKEN');
    if (!token || token === 'your_discord_bot_token_here') {
      this.logger.warn('DISCORD_TOKEN not configured — Discord bot disabled.');
      return;
    }
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel, Partials.Message],
    });

    this.client.once(Events.ClientReady, async (c) => {
      this.logger.log(`Discord bot logged in as ${c.user.tag}`);
      await this.registerCommands();
    });

    this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      try {
        await this.registry.handle(interaction);
      } catch (err) {
        this.logger.error(`Interaction error: ${(err as Error).message}`, (err as Error).stack);
        if (interaction.isRepliable() && !interaction.replied) {
          await interaction
            .reply({ content: 'Erro interno. Tente novamente.', ephemeral: true })
            .catch(() => undefined);
        }
      }
    });

    try {
      await this.client.login(token);
    } catch (err) {
      this.logger.error(`Discord login failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
  }

  private async registerCommands(): Promise<void> {
    if (!this.client?.user) return;
    const clientId = this.config.get<string>('DISCORD_CLIENT_ID') ?? this.client.user.id;
    const guildId = this.config.get<string>('DISCORD_GUILD_ID');
    const rest = new REST({ version: '10' }).setToken(
      this.config.getOrThrow<string>('DISCORD_TOKEN'),
    );
    const commands = this.registry.toJSON();
    try {
      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        this.logger.log(`Registered ${commands.length} guild commands`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        this.logger.log(`Registered ${commands.length} global commands`);
      }
    } catch (err) {
      this.logger.error(`Command registration failed: ${(err as Error).message}`);
    }
  }
}
