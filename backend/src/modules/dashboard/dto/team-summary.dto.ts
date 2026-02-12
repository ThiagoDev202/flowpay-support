import { ApiProperty } from '@nestjs/swagger';
import { TeamType } from '@prisma/client';

/**
 * DTO para resumo de um time no dashboard
 */
export class TeamSummaryDto {
  @ApiProperty({ description: 'ID do time' })
  teamId: string;

  @ApiProperty({ description: 'Nome do time', example: 'Time Cartões' })
  teamName: string;

  @ApiProperty({ enum: TeamType, description: 'Tipo do time' })
  teamType: TeamType;

  @ApiProperty({ description: 'Tickets ativos (IN_PROGRESS) do time', example: 5 })
  activeTickets: number;

  @ApiProperty({ description: 'Tamanho da fila (WAITING) do time', example: 3 })
  queueSize: number;

  @ApiProperty({
    description: 'Número de agentes disponíveis (com < 3 tickets)',
    example: 2,
  })
  availableAgents: number;

  @ApiProperty({ description: 'Total de agentes no time', example: 3 })
  totalAgents: number;
}
