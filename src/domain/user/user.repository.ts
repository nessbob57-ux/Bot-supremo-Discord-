import { User } from './user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByDiscordId(tenantId: string, discordId: string): Promise<User | null>;
  findManyBySegment(tenantId: string, segment: string): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
