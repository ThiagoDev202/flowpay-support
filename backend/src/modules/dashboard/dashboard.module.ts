import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '@/database/database.module';

/**
 * Tarefa 4.6: Dashboard Module
 * Módulo responsável pelas funcionalidades do dashboard
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
