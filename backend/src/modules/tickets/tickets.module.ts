import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsGateway } from './tickets.gateway';
import { QueueModule } from '@/modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsGateway],
  exports: [TicketsService, TicketsGateway],
})
export class TicketsModule {}
