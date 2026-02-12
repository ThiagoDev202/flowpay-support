import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { TicketsGateway } from '@/modules/tickets/tickets.gateway';
import { AgentResponseDto } from './dto/agent-response.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TicketsGateway))
    private readonly gateway: TicketsGateway,
  ) {}

  async findAll(): Promise<AgentResponseDto[]> {
    const agents = await this.prisma.agent.findMany({
      include: {
        team: true,
        currentTickets: {
          where: {
            status: TicketStatus.IN_PROGRESS,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return agents.map((agent) => ({
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
    }));
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        team: true,
        currentTickets: {
          where: {
            status: TicketStatus.IN_PROGRESS,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agente com ID ${id} não encontrado`);
    }

    return {
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
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateAgentStatusDto,
  ): Promise<AgentResponseDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException(`Agente com ID ${id} não encontrado`);
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id },
      data: {
        isOnline: dto.isOnline,
      },
      include: {
        team: true,
        currentTickets: {
          where: {
            status: TicketStatus.IN_PROGRESS,
          },
        },
      },
    });

    const agentResponse: AgentResponseDto = {
      id: updatedAgent.id,
      name: updatedAgent.name,
      email: updatedAgent.email,
      teamId: updatedAgent.teamId,
      team: {
        id: updatedAgent.team.id,
        name: updatedAgent.team.name,
        type: updatedAgent.team.type,
      },
      maxConcurrent: updatedAgent.maxConcurrent,
      activeTicketsCount: updatedAgent.currentTickets.length,
      isOnline: updatedAgent.isOnline,
      createdAt: updatedAgent.createdAt,
      updatedAt: updatedAgent.updatedAt,
    };

    // Emite evento WebSocket: agent:status-changed
    this.gateway.emitAgentStatusChanged(
      agentResponse,
      updatedAgent.currentTickets.length,
    );

    return agentResponse;
  }
}
