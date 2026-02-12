import { ApiProperty } from '@nestjs/swagger';
import { TeamType } from '@prisma/client';

export class TeamResponseDto {
  @ApiProperty({
    description: 'ID único do time',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do time',
    example: 'Time Cartões',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do time',
    enum: TeamType,
    example: TeamType.CARDS,
  })
  type: TeamType;

  @ApiProperty({
    description: 'Quantidade de agentes no time',
    example: 3,
  })
  agentsCount: number;

  @ApiProperty({
    description: 'Quantidade de tickets ativos (em atendimento)',
    example: 5,
  })
  activeTicketsCount: number;

  @ApiProperty({
    description: 'Tamanho da fila de espera',
    example: 2,
  })
  queueSize: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-02-11T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2026-02-11T10:00:00.000Z',
  })
  updatedAt: Date;
}
