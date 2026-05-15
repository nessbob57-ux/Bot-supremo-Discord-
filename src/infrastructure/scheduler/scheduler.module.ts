import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), CqrsModule, PersistenceModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
