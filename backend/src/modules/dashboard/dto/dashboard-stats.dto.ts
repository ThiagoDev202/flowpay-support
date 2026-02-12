import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para estatísticas gerais do dashboard
 */
export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de tickets no sistema', example: 150 })
  totalTickets: number;

  @ApiProperty({ description: 'Tickets em atendimento', example: 12 })
  inProgress: number;

  @ApiProperty({ description: 'Tickets na fila aguardando', example: 8 })
  inQueue: number;

  @ApiProperty({ description: 'Tickets completados', example: 130 })
  completed: number;

  @ApiProperty({
    description: 'Tempo médio de espera em segundos',
    example: 245.5,
  })
  avgWaitTime: number;
}
