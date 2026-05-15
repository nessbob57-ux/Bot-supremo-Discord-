import { Inject, Injectable } from '@nestjs/common';
import { User } from '@domain/user/user.entity';
import { IUserRepository, USER_REPOSITORY } from '@domain/user/user.repository';

export interface EnsureUserInput {
  tenantId: string;
  discordId: string;
  username: string;
  language?: string;
}

@Injectable()
export class EnsureUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(input: EnsureUserInput): Promise<User> {
    const existing = await this.users.findByDiscordId(input.tenantId, input.discordId);
    if (existing) {
      existing.markActive();
      return this.users.save(existing);
    }
    const user = User.create({
      tenantId: input.tenantId,
      discordId: input.discordId,
      username: input.username,
      language: input.language ?? 'pt-BR',
    });
    return this.users.save(user);
  }
}
