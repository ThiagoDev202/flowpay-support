import { Module, forwardRef } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { TicketsModule } from '@/modules/tickets/tickets.module';

@Module({
  imports: [forwardRef(() => TicketsModule)],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
