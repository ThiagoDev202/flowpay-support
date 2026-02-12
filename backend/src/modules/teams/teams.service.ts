import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { TeamResponseDto } from './dto/team-response.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TeamResponseDto[]> {
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

    return teams.map((team) => {
      const activeTicketsCount = team.agents.reduce(
        (sum, agent) => sum + agent.currentTickets.length,
        0,
      );

      return {
        id: team.id,
        name: team.name,
        type: team.type,
        agentsCount: team.agents.length,
        activeTicketsCount,
        queueSize: 0, // Será implementado no MILESTONE 3 com BullMQ
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    });
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    const team = await this.prisma.team.findUnique({
      where: { id },
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
    });

    if (!team) {
      throw new NotFoundException(`Time com ID ${id} não encontrado`);
    }

    const activeTicketsCount = team.agents.reduce(
      (sum, agent) => sum + agent.currentTickets.length,
      0,
    );

    return {
      id: team.id,
      name: team.name,
      type: team.type,
      agentsCount: team.agents.length,
      activeTicketsCount,
      queueSize: 0, // Será implementado no MILESTONE 3 com BullMQ
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}
