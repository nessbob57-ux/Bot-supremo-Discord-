import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@domain/user/user.repository';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class GrantXpUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(
    userId: string,
    amount: number,
  ): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    const beforeLevel = user.level;
    user.addXp(amount);
    await this.users.save(user);
    return { xp: user.xp, level: user.level, leveledUp: user.level > beforeLevel };
  }
}
