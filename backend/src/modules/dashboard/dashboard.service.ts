import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { TeamSummaryDto } from './dto/team-summary.dto';
import { TicketStatus, TicketSubject, TeamType } from '@prisma/client';

/**
 * Tarefa 4.6: Dashboard Service
 * Serviço responsável por agregar dados para o dashboard
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna estatísticas gerais do sistema
   * GET /dashboard/stats
   */
  async getStats(): Promise<DashboardStatsDto> {
    try {
      // Total de tickets
      const totalTickets = await this.prisma.ticket.count();

      // Tickets em progresso
      const inProgress = await this.prisma.ticket.count({
        where: { status: TicketStatus.IN_PROGRESS },
      });

      // Tickets na fila
      const inQueue = await this.prisma.ticket.count({
        where: { status: TicketStatus.WAITING },
      });

      // Tickets completados
      const completed = await this.prisma.ticket.count({
        where: { status: TicketStatus.COMPLETED },
      });

      // Calcula tempo médio de espera (apenas tickets completados)
      const completedTickets = await this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.COMPLETED,
          startedAt: { not: null },
        },
        select: {
          createdAt: true,
          startedAt: true,
        },
      });

      let avgWaitTime = 0;
      if (completedTickets.length > 0) {
        const totalWaitTime = completedTickets.reduce((sum, ticket) => {
          const waitTime = ticket.startedAt.getTime() - ticket.createdAt.getTime();
          return sum + waitTime;
        }, 0);

        // Converte de milissegundos para segundos
        avgWaitTime = totalWaitTime / completedTickets.length / 1000;
      }

      const stats: DashboardStatsDto = {
        totalTickets,
        inProgress,
        inQueue,
        completed,
        avgWaitTime: Math.round(avgWaitTime * 10) / 10, // Arredonda para 1 casa decimal
      };

      this.logger.debug(`Stats calculated: ${JSON.stringify(stats)}`);

      return stats;
    } catch (error) {
      this.logger.error(`Error calculating stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retorna resumo de todos os times
   * GET /dashboard/teams
   */
  async getTeamsSummary(): Promise<TeamSummaryDto[]> {
    try {
      // Busca todos os times
      const teams = await this.prisma.team.findMany({
        include: {
          agents: {
            include: {
              currentTickets: {
                where: {
                  status: TicketStatus.IN_PROGRESS,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Mapeia os assuntos para cada tipo de time
      const subjectsByTeamType: Record<TeamType, TicketSubject> = {
        CARDS: TicketSubject.CARD_PROBLEM,
        LOANS: TicketSubject.LOAN_REQUEST,
        OTHER: TicketSubject.OTHER,
      };

      const teamsSummary = await Promise.all(
        teams.map(async (team) => {
          // Conta tickets ativos (IN_PROGRESS) do time
          const activeTickets = await this.prisma.ticket.count({
            where: {
              status: TicketStatus.IN_PROGRESS,
              subject: subjectsByTeamType[team.type],
            },
          });

          // Conta tickets na fila (WAITING) do time
          const queueSize = await this.prisma.ticket.count({
            where: {
              status: TicketStatus.WAITING,
              subject: subjectsByTeamType[team.type],
            },
          });

          // Conta agentes disponíveis (com < maxConcurrent tickets ativos e online)
          const availableAgents = team.agents.filter(
            (agent) => agent.isOnline && agent.currentTickets.length < agent.maxConcurrent,
          ).length;

          // Total de agentes no time
          const totalAgents = team.agents.length;

          const summary: TeamSummaryDto = {
            teamId: team.id,
            teamName: team.name,
            teamType: team.type,
            activeTickets,
            queueSize,
            availableAgents,
            totalAgents,
          };

          return summary;
        }),
      );

      this.logger.debug(`Teams summary calculated: ${teamsSummary.length} teams`);

      return teamsSummary;
    } catch (error) {
      this.logger.error(`Error calculating teams summary: ${error.message}`);
      throw error;
    }
  }
}
