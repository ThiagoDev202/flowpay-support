import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/database/prisma.service';
import { TeamType, TicketSubject, TicketStatus, Agent, Ticket } from '@prisma/client';

interface DistributeTicketJob {
  ticketId: string;
  teamType: TeamType;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private gateway: any; // TicketsGateway (evita referência circular)

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cards-queue') private readonly cardsQueue: Queue,
    @InjectQueue('loans-queue') private readonly loansQueue: Queue,
    @InjectQueue('other-queue') private readonly otherQueue: Queue,
  ) {}

  /**
   * Define o gateway para emissão de eventos (evita dependência circular)
   */
  setGateway(gateway: any): void {
    this.gateway = gateway;
  }

  /**
   * Tarefa 3.2: Mapeia o assunto do ticket para o tipo de time
   */
  mapSubjectToTeam(subject: TicketSubject): TeamType {
    const mapping: Record<TicketSubject, TeamType> = {
      CARD_PROBLEM: TeamType.CARDS,
      LOAN_REQUEST: TeamType.LOANS,
      OTHER: TeamType.OTHER,
    };

    return mapping[subject];
  }

  /**
   * Tarefa 3.3: Busca agente disponível com menor carga
   * Retorna null se todos estiverem com 3 tickets ativos
   */
  async findAvailableAgent(teamType: TeamType): Promise<Agent | null> {
    try {
      // Busca todos os agentes do time que estão online
      const agents = await this.prisma.agent.findMany({
        where: {
          isOnline: true,
          team: {
            type: teamType,
          },
        },
        include: {
          currentTickets: {
            where: {
              status: TicketStatus.IN_PROGRESS,
            },
          },
        },
      });

      if (agents.length === 0) {
        this.logger.warn(`No online agents found for team ${teamType}`);
        return null;
      }

      // Filtra agentes que têm menos de 3 tickets ativos
      const availableAgents = agents.filter(
        (agent) => agent.currentTickets.length < agent.maxConcurrent,
      );

      if (availableAgents.length === 0) {
        this.logger.warn(`All agents in team ${teamType} are at max capacity`);
        return null;
      }

      // Ordena por carga (menor para maior) e retorna o primeiro
      availableAgents.sort(
        (a, b) => a.currentTickets.length - b.currentTickets.length,
      );

      const selectedAgent = availableAgents[0];
      this.logger.log(
        `Selected agent ${selectedAgent.name} (${selectedAgent.currentTickets.length} active tickets) for team ${teamType}`,
      );

      return selectedAgent;
    } catch (error) {
      this.logger.error(`Error finding available agent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tarefa 3.4: Atribui ticket a um agente
   */
  async assignTicketToAgent(ticketId: string, agentId: string): Promise<Ticket> {
    try {
      const ticket = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          agentId,
          status: TicketStatus.IN_PROGRESS,
          startedAt: new Date(),
          queuePosition: null, // Remove da fila
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Ticket ${ticketId} assigned to agent ${ticket.agent.name}`,
      );

      // Emite evento WebSocket: ticket:assigned
      if (this.gateway && ticket.agent) {
        const agent = await this.prisma.agent.findUnique({
          where: { id: agentId },
          include: {
            team: true,
            currentTickets: {
              where: { status: TicketStatus.IN_PROGRESS },
            },
          },
        });

        if (agent) {
          this.gateway.emitTicketAssigned(
            {
              id: ticket.id,
              customerName: ticket.customerName,
              subject: ticket.subject,
              status: ticket.status,
              agentId: ticket.agentId,
              agent: {
                id: ticket.agent.id,
                name: ticket.agent.name,
              },
              queuePosition: ticket.queuePosition,
              startedAt: ticket.startedAt,
              completedAt: ticket.completedAt,
              createdAt: ticket.createdAt,
              updatedAt: ticket.updatedAt,
            },
            {
              id: agent.id,
              name: agent.name,
              email: agent.email,
              teamId: agent.teamId,
              team: {
                id: agent.team.id,
                name: agent.team.name,
                type: agent.team.type,
              },
              maxConcurrent: agent.maxConcurrent,
              activeTicketsCount: agent.currentTickets.length,
              isOnline: agent.isOnline,
              createdAt: agent.createdAt,
              updatedAt: agent.updatedAt,
            },
          );
        }
      }

      return ticket;
    } catch (error) {
      this.logger.error(`Error assigning ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tarefa 3.5: Adiciona ticket na fila correspondente
   */
  async enqueueTicket(ticketId: string, teamType: TeamType): Promise<void> {
    try {
      // Calcula a posição na fila
      const queuePosition = await this.getQueueSize(teamType);

      // Atualiza o ticket com a posição na fila
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          queuePosition: queuePosition + 1,
          status: TicketStatus.WAITING,
        },
      });

      // Seleciona a fila correta
      const queue = this.getQueueByTeamType(teamType);

      // Adiciona job na fila
      const job: DistributeTicketJob = {
        ticketId,
        teamType,
      };

      await queue.add('distribute-ticket', job, {
        removeOnComplete: true,
        removeOnFail: false,
      });

      const newQueueSize = queuePosition + 1;

      this.logger.log(
        `Ticket ${ticketId} enqueued in ${teamType} queue at position ${newQueueSize}`,
      );

      // Emite evento WebSocket: queue:updated
      if (this.gateway) {
        this.gateway.emitQueueUpdated(teamType, newQueueSize);
      }
    } catch (error) {
      this.logger.error(`Error enqueuing ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tarefa 3.6: Remove e retorna o próximo ticket da fila (FIFO)
   */
  async dequeueNext(teamType: TeamType): Promise<Ticket | null> {
    try {
      // Busca o time correspondente
      const team = await this.prisma.team.findUnique({
        where: { type: teamType },
      });

      if (!team) {
        throw new NotFoundException(`Team ${teamType} not found`);
      }

      // Busca o ticket mais antigo em WAITING do time específico
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          status: TicketStatus.WAITING,
          subject: this.mapTeamToSubjects(teamType),
        },
        orderBy: {
          createdAt: 'asc', // FIFO: primeiro que entrou, primeiro que sai
        },
      });

      if (ticket) {
        this.logger.log(
          `Dequeued ticket ${ticket.id} from ${teamType} queue (created at ${ticket.createdAt})`,
        );
      }

      return ticket;
    } catch (error) {
      this.logger.error(`Error dequeuing ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Distribui um ticket: atribui a agente disponível ou enfileira
   */
  async distributeTicket(ticketId: string): Promise<void> {
    try {
      // Busca o ticket
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      // Mapeia o assunto para o time
      const teamType = this.mapSubjectToTeam(ticket.subject);

      // Busca agente disponível
      const agent = await this.findAvailableAgent(teamType);

      if (agent) {
        // Se há agente disponível, atribui o ticket
        await this.assignTicketToAgent(ticketId, agent.id);
        this.logger.log(
          `Ticket ${ticketId} distributed to agent ${agent.name}`,
        );
      } else {
        // Se não há agente disponível, enfileira
        await this.enqueueTicket(ticketId, teamType);
        this.logger.log(`Ticket ${ticketId} added to ${teamType} queue`);
      }
    } catch (error) {
      this.logger.error(`Error distributing ticket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa a fila: enquanto houver agentes disponíveis E tickets na fila, distribui
   */
  async processQueue(teamType: TeamType): Promise<void> {
    try {
      this.logger.log(`Processing ${teamType} queue...`);

      let agent = await this.findAvailableAgent(teamType);

      while (agent) {
        const ticket = await this.dequeueNext(teamType);

        if (!ticket) {
          this.logger.log(`No more tickets in ${teamType} queue`);
          break;
        }

        await this.assignTicketToAgent(ticket.id, agent.id);
        this.logger.log(
          `Assigned ticket ${ticket.id} to agent ${agent.name} from queue`,
        );

        // Atualiza as posições na fila
        await this.updateQueuePositions(teamType);

        // Emite evento queue:updated com novo tamanho
        const newQueueSize = await this.getQueueSize(teamType);
        if (this.gateway) {
          this.gateway.emitQueueUpdated(teamType, newQueueSize);
        }

        // Verifica se ainda há agentes disponíveis
        agent = await this.findAvailableAgent(teamType);
      }

      this.logger.log(`Finished processing ${teamType} queue`);
    } catch (error) {
      this.logger.error(`Error processing queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processa um job individual da fila (chamado pelo processor)
   */
  async processQueueJob(ticketId: string): Promise<void> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        this.logger.warn(`Ticket ${ticketId} not found, skipping job`);
        return;
      }

      // Se o ticket já foi atribuído, não faz nada
      if (ticket.status !== TicketStatus.WAITING) {
        this.logger.log(
          `Ticket ${ticketId} already processed (status: ${ticket.status})`,
        );
        return;
      }

      const teamType = this.mapSubjectToTeam(ticket.subject);
      const agent = await this.findAvailableAgent(teamType);

      if (agent) {
        await this.assignTicketToAgent(ticketId, agent.id);
        this.logger.log(
          `Job processed: Ticket ${ticketId} assigned to agent ${agent.name}`,
        );
      } else {
        this.logger.log(
          `No available agent for ticket ${ticketId}, will retry later`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing queue job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helpers privados
   */

  private getQueueByTeamType(teamType: TeamType): Queue {
    switch (teamType) {
      case TeamType.CARDS:
        return this.cardsQueue;
      case TeamType.LOANS:
        return this.loansQueue;
      case TeamType.OTHER:
        return this.otherQueue;
      default:
        throw new Error(`Invalid team type: ${teamType}`);
    }
  }

  private mapTeamToSubjects(teamType: TeamType): TicketSubject {
    switch (teamType) {
      case TeamType.CARDS:
        return TicketSubject.CARD_PROBLEM;
      case TeamType.LOANS:
        return TicketSubject.LOAN_REQUEST;
      case TeamType.OTHER:
        return TicketSubject.OTHER;
      default:
        throw new Error(`Invalid team type: ${teamType}`);
    }
  }

  private async getQueueSize(teamType: TeamType): Promise<number> {
    const subject = this.mapTeamToSubjects(teamType);

    const count = await this.prisma.ticket.count({
      where: {
        status: TicketStatus.WAITING,
        subject,
      },
    });

    return count;
  }

  private async updateQueuePositions(teamType: TeamType): Promise<void> {
    const subject = this.mapTeamToSubjects(teamType);

    // Busca todos os tickets em espera do time, ordenados por createdAt
    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: TicketStatus.WAITING,
        subject,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Atualiza a posição de cada ticket
    for (let i = 0; i < tickets.length; i++) {
      await this.prisma.ticket.update({
        where: { id: tickets[i].id },
        data: { queuePosition: i + 1 },
      });
    }
  }
}
