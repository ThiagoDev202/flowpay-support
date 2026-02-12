import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketSubject, TicketStatus } from '@prisma/client';

class AgentInfoDto {
  @ApiProperty({
    description: 'ID do agente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do agente',
    example: 'João Silva',
  })
  name: string;
}

export class TicketResponseDto {
  @ApiProperty({
    description: 'ID único do ticket',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Maria Oliveira',
  })
  customerName: string;

  @ApiProperty({
    description: 'Assunto do ticket',
    enum: TicketSubject,
    example: TicketSubject.CARD_PROBLEM,
  })
  subject: TicketSubject;

  @ApiProperty({
    description: 'Status do ticket',
    enum: TicketStatus,
    example: TicketStatus.WAITING,
  })
  status: TicketStatus;

  @ApiPropertyOptional({
    description: 'ID do agente responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  agentId?: string | null;

  @ApiPropertyOptional({
    description: 'Informações do agente responsável',
    type: AgentInfoDto,
    nullable: true,
  })
  agent?: AgentInfoDto | null;

  @ApiPropertyOptional({
    description: 'Posição na fila (apenas para status WAITING)',
    example: 3,
    nullable: true,
  })
  queuePosition?: number | null;

  @ApiPropertyOptional({
    description: 'Data de início do atendimento',
    example: '2026-02-11T10:00:00.000Z',
    nullable: true,
  })
  startedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Data de conclusão do atendimento',
    example: '2026-02-11T10:30:00.000Z',
    nullable: true,
  })
  completedAt?: Date | null;

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
