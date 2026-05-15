import { Injectable, Logger } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export interface SlashCommandData {
  name: string;
  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export interface SlashCommand {
  data: SlashCommandData;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export type ComponentHandler<I extends Interaction = Interaction> = (
  interaction: I,
) => Promise<void>;

@Injectable()
export class CommandRegistry {
  private readonly logger = new Logger(CommandRegistry.name);
  private readonly slashCommands = new Map<string, SlashCommand>();
  private readonly buttonHandlers = new Map<string, ComponentHandler<ButtonInteraction>>();
  private readonly selectMenuHandlers = new Map<
    string,
    ComponentHandler<StringSelectMenuInteraction>
  >();
  private readonly modalHandlers = new Map<string, ComponentHandler<ModalSubmitInteraction>>();

  registerCommand(command: SlashCommand): void {
    const name = command.data.name;
    this.slashCommands.set(name, command);
    this.logger.log(`Registered slash command: /${name}`);
  }

  registerButton(prefix: string, handler: ComponentHandler<ButtonInteraction>): void {
    this.buttonHandlers.set(prefix, handler);
  }

  registerSelectMenu(prefix: string, handler: ComponentHandler<StringSelectMenuInteraction>): void {
    this.selectMenuHandlers.set(prefix, handler);
  }

  registerModal(prefix: string, handler: ComponentHandler<ModalSubmitInteraction>): void {
    this.modalHandlers.set(prefix, handler);
  }

  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return Array.from(this.slashCommands.values()).map((c) => c.data.toJSON());
  }

  async handle(interaction: Interaction): Promise<void> {
    if (interaction.isChatInputCommand()) {
      const cmd = this.slashCommands.get(interaction.commandName);
      if (cmd) {
        await cmd.execute(interaction);
      }
      return;
    }
    if (interaction.isButton()) {
      const handler = this.findPrefixedHandler(this.buttonHandlers, interaction.customId);
      if (handler) await handler(interaction);
      return;
    }
    if (interaction.isStringSelectMenu()) {
      const handler = this.findPrefixedHandler(this.selectMenuHandlers, interaction.customId);
      if (handler) await handler(interaction);
      return;
    }
    if (interaction.isModalSubmit()) {
      const handler = this.findPrefixedHandler(this.modalHandlers, interaction.customId);
      if (handler) await handler(interaction);
      return;
    }
  }

  private findPrefixedHandler<H>(map: Map<string, H>, customId: string): H | undefined {
    for (const [prefix, handler] of map.entries()) {
      if (customId === prefix || customId.startsWith(`${prefix}:`)) {
        return handler;
      }
    }
    return undefined;
  }
}
