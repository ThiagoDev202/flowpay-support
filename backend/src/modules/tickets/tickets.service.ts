import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { QueueService } from '@/modules/queue/queue.service';
import { TicketsGateway } from './tickets.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketStatus, TicketSubject } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => TicketsGateway))
    private readonly gateway: TicketsGateway,
  ) {
    // Injeta o gateway no QueueService para emissão de eventos
    this.queueService.setGateway(this.gateway);
  }

  private async emitLatestDashboardStats(): Promise<void> {
    const [totalTickets, inProgress, inQueue, completed, completedTickets] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.WAITING } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.COMPLETED } }),
      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.COMPLETED,
          startedAt: { not: null },
        },
        select: { createdAt: true, startedAt: true },
      }),
    ]);

    let avgWaitTime = 0;
    if (completedTickets.length > 0) {
      const totalWaitTime = completedTickets.reduce((sum, ticket) => {
        const startedAt = ticket.startedAt?.getTime() ?? ticket.createdAt.getTime();
        return sum + (startedAt - ticket.createdAt.getTime());
      }, 0);
      avgWaitTime = Math.round((totalWaitTime / completedTickets.length / 1000) * 10) / 10;
    }

    this.gateway.emitDashboardStats({
      totalTickets,
      inProgress,
      inQueue,
      completed,
      avgWaitTime,
    });
  }

  async create(dto: CreateTicketDto): Promise<TicketResponseDto> {
    // Cria o ticket com status WAITING
    const ticket = await this.prisma.ticket.create({
      data: {
        customerName: dto.customerName,
        subject: dto.subject,
        status: TicketStatus.WAITING,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Distribui o ticket automaticamente (MILESTONE 3)
    // Isso tentará atribuir a um agente disponível ou enfileirar
    await this.queueService.distributeTicket(ticket.id);

    // Busca o ticket atualizado após a distribuição
    const updatedTicket = await this.prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const ticketResponse: TicketResponseDto = {
      id: updatedTicket.id,
      customerName: updatedTicket.customerName,
      subject: updatedTicket.subject,
      status: updatedTicket.status,
      agentId: updatedTicket.agentId,
      agent: updatedTicket.agent
        ? {
            id: updatedTicket.agent.id,
            name: updatedTicket.agent.name,
          }
        : null,
      queuePosition: updatedTicket.queuePosition,
      startedAt: updatedTicket.startedAt,
      completedAt: updatedTicket.completedAt,
      createdAt: updatedTicket.createdAt,
      updatedAt: updatedTicket.updatedAt,
    };

    // Emite evento WebSocket: ticket:created
    this.gateway.emitTicketCreated(ticketResponse);
    await this.emitLatestDashboardStats();

    return ticketResponse;
  }

  async findAll(filters?: {
    status?: TicketStatus;
    subject?: TicketSubject;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<TicketResponseDto[]> {
    const { status, subject, agentId, limit = 50, offset = 0 } = filters || {};

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (subject) {
      where.subject = subject;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return tickets.map((ticket) => ({
      id: ticket.id,
      customerName: ticket.customerName,
      subject: ticket.subject,
      status: ticket.status,
      agentId: ticket.agentId,
      agent: ticket.agent
        ? {
            id: ticket.agent.id,
            name: ticket.agent.name,
          }
        : null,
      queuePosition: ticket.queuePosition,
      startedAt: ticket.startedAt,
      completedAt: ticket.completedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));
  }

  async findOne(id: string): Promise<TicketResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket com ID ${id} não encontrado`);
    }

    return {
      id: ticket.id,
      customerName: ticket.customerName,
      subject: ticket.subject,
      status: ticket.status,
      agentId: ticket.agentId,
      agent: ticket.agent
        ? {
            id: ticket.agent.id,
            name: ticket.agent.name,
          }
        : null,
      queuePosition: ticket.queuePosition,
      startedAt: ticket.startedAt,
      completedAt: ticket.completedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  async complete(id: string): Promise<TicketResponseDto> {
    // Busca o ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket com ID ${id} não encontrado`);
    }

    // Valida se o ticket está em progresso
    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Ticket ${id} não está em progresso (status atual: ${ticket.status})`,
      );
    }

    // Valida se o ticket tem um agente atribuído
    if (!ticket.agentId) {
      throw new BadRequestException(`Ticket ${id} não tem um agente atribuído`);
    }

    // Atualiza o ticket para COMPLETED
    const completedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.COMPLETED,
        completedAt: new Date(),
        completedById: ticket.agentId,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mapeia o assunto para o time
    const teamType = this.queueService.mapSubjectToTeam(ticket.subject);

    const ticketResponse: TicketResponseDto = {
      id: completedTicket.id,
      customerName: completedTicket.customerName,
      subject: completedTicket.subject,
      status: completedTicket.status,
      agentId: completedTicket.agentId,
      agent: completedTicket.agent
        ? {
            id: completedTicket.agent.id,
            name: completedTicket.agent.name,
          }
        : null,
      queuePosition: completedTicket.queuePosition,
      startedAt: completedTicket.startedAt,
      completedAt: completedTicket.completedAt,
      createdAt: completedTicket.createdAt,
      updatedAt: completedTicket.updatedAt,
    };

    // Busca informações completas do agente para o evento
    const agent = await this.prisma.agent.findUnique({
      where: { id: ticket.agentId },
      include: {
        team: true,
        currentTickets: {
          where: { status: TicketStatus.IN_PROGRESS },
        },
      },
    });

    // Emite evento WebSocket: ticket:completed
    if (agent) {
      this.gateway.emitTicketCompleted(ticketResponse, {
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
      });
    }

    // Processa a fila do time para distribuir próximo ticket
    await this.queueService.processQueue(teamType);
    await this.emitLatestDashboardStats();

    return ticketResponse;
  }
}
