import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client!: Redis;
  private inMemory = new Map<string, { value: string; expiresAt?: number }>();
  private useFallback = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.client = new Redis({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: this.config.get<string>('REDIS_PASSWORD') || undefined,
        db: this.config.get<number>('REDIS_DB', 0),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.client.on('error', () => {
        this.useFallback = true;
      });
      await this.client.connect();
      this.logger.log('Connected to Redis');
    } catch (err) {
      this.useFallback = true;
      this.logger.warn(`Redis unavailable, using in-memory fallback: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && !this.useFallback) {
      try {
        await this.client.quit();
      } catch {
        /* ignore */
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useFallback) {
      const v = this.inMemory.get(key);
      if (!v) return null;
      if (v.expiresAt && v.expiresAt < Date.now()) {
        this.inMemory.delete(key);
        return null;
      }
      return v.value;
    }
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useFallback) {
      this.inMemory.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
      return;
    }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (this.useFallback) {
      this.inMemory.delete(key);
      return;
    }
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    if (this.useFallback) {
      const current = parseInt((await this.get(key)) ?? '0', 10) + 1;
      await this.set(key, String(current));
      return current;
    }
    return this.client.incr(key);
  }
}
