import { ApiProperty } from '@nestjs/swagger';
import { TeamType } from '@prisma/client';

class TeamInfoDto {
  @ApiProperty({
    description: 'ID do time',
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
}

export class AgentResponseDto {
  @ApiProperty({
    description: 'ID único do agente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do agente',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do agente',
    example: 'joao.silva@flowpay.com',
  })
  email: string;

  @ApiProperty({
    description: 'ID do time',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  teamId: string;

  @ApiProperty({
    description: 'Informações do time',
    type: TeamInfoDto,
  })
  team: TeamInfoDto;

  @ApiProperty({
    description: 'Quantidade máxima de atendimentos simultâneos',
    example: 3,
  })
  maxConcurrent: number;

  @ApiProperty({
    description: 'Quantidade de tickets ativos (em atendimento)',
    example: 2,
  })
  activeTicketsCount: number;

  @ApiProperty({
    description: 'Status online/offline do agente',
    example: true,
  })
  isOnline: boolean;

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
