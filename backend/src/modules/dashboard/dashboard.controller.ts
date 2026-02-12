import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, TeamSummaryDto } from './dto';

/**
 * Tarefa 4.6: Dashboard Controller
 * Endpoints para dados do dashboard
 */
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Retorna estatísticas gerais do sistema
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Obter estatísticas do dashboard',
    description:
      'Retorna métricas gerais: total de tickets, em progresso, na fila, completados e tempo médio de espera',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    type: DashboardStatsDto,
  })
  async getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }

  /**
   * GET /dashboard/teams
   * Retorna resumo de todos os times
   */
  @Get('teams')
  @ApiOperation({
    summary: 'Obter resumo dos times',
    description: 'Retorna status de cada time: tickets ativos, fila, agentes disponíveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo dos times retornado com sucesso',
    type: [TeamSummaryDto],
  })
  async getTeamsSummary(): Promise<TeamSummaryDto[]> {
    return this.dashboardService.getTeamsSummary();
  }
}
