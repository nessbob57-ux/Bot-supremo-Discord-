import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';

import { PrismaModule } from '@infrastructure/database/prisma.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { PaymentsInfraModule } from '@infrastructure/payments/payments.module';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';
import { ApplicationModule } from '@application/application.module';
import { DiscordModule } from '@interface/discord/discord.module';
import { HttpModule } from '@interface/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        DISCORD_TOKEN: Joi.string().optional().allow(''),
        DISCORD_CLIENT_ID: Joi.string().optional().allow(''),
        JWT_SECRET: Joi.string().default('change_me_in_production'),
        LOG_LEVEL: Joi.string().default('info'),
      }).unknown(true),
    }),
    CqrsModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    PersistenceModule,
    PaymentsInfraModule,
    ApplicationModule,
    SchedulerModule,
    DiscordModule,
    HttpModule,
  ],
})
export class AppModule {}
