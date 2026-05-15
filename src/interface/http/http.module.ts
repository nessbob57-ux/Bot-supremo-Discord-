import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { HealthController } from './controllers/health.controller';
import { ProductsController } from './controllers/products.controller';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  imports: [ApplicationModule, PersistenceModule],
  controllers: [HealthController, ProductsController, WebhooksController],
})
export class HttpModule {}
