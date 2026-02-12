import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { CardsQueueProcessor, LoansQueueProcessor, OtherQueueProcessor } from './queue.processor';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'cards-queue',
      },
      {
        name: 'loans-queue',
      },
      {
        name: 'other-queue',
      },
    ),
  ],
  providers: [QueueService, CardsQueueProcessor, LoansQueueProcessor, OtherQueueProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
