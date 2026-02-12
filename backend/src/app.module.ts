import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TeamsModule } from './modules/teams/teams.module';
import { AgentsModule } from './modules/agents/agents.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { QueueModule } from './modules/queue/queue.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
      cache: true,
    }),
    DatabaseModule,
    QueueModule,
    TeamsModule,
    AgentsModule,
    TicketsModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
