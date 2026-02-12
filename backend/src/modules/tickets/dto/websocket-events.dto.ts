import { ApiProperty } from '@nestjs/swagger';
import { TeamType } from '@prisma/client';
import { TicketResponseDto } from './ticket-response.dto';
import { AgentResponseDto } from '@/modules/agents/dto/agent-response.dto';

/**
 * Evento emitido quando um ticket é criado
 * WebSocket event: 'ticket:created'
 */
export class TicketCreatedEvent {
  @ApiProperty({ type: TicketResponseDto })
  ticket: TicketResponseDto;

  @ApiProperty({
    description: 'Posição na fila (se não foi atribuído imediatamente)',
    required: false,
  })
  queuePosition?: number;
}

/**
 * Evento emitido quando um ticket é atribuído a um agente
 * WebSocket event: 'ticket:assigned'
 */
export class TicketAssignedEvent {
  @ApiProperty({ type: TicketResponseDto })
  ticket: TicketResponseDto;

  @ApiProperty({ type: AgentResponseDto })
  agent: AgentResponseDto;
}

/**
 * Evento emitido quando um ticket é completado
 * WebSocket event: 'ticket:completed'
 */
export class TicketCompletedEvent {
  @ApiProperty({ type: TicketResponseDto })
  ticket: TicketResponseDto;

  @ApiProperty({ type: AgentResponseDto })
  agent: AgentResponseDto;
}

/**
 * Evento emitido quando a fila é atualizada
 * WebSocket event: 'queue:updated'
 */
export class QueueUpdatedEvent {
  @ApiProperty({ enum: TeamType })
  teamType: TeamType;

  @ApiProperty({ description: 'Tamanho atual da fila' })
  queueSize: number;
}

/**
 * Evento emitido quando o status de um agente muda
 * WebSocket event: 'agent:status-changed'
 */
export class AgentStatusChangedEvent {
  @ApiProperty({ type: AgentResponseDto })
  agent: AgentResponseDto;

  @ApiProperty({ description: 'Número de tickets ativos do agente' })
  activeCount: number;
}

/**
 * DTO para estatísticas do dashboard
 */
export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de tickets no sistema' })
  totalTickets: number;

  @ApiProperty({ description: 'Tickets em atendimento' })
  inProgress: number;

  @ApiProperty({ description: 'Tickets na fila' })
  inQueue: number;

  @ApiProperty({ description: 'Tickets completados' })
  completed: number;

  @ApiProperty({ description: 'Tempo médio de espera em segundos' })
  avgWaitTime: number;
}

/**
 * Evento emitido quando as estatísticas do dashboard são atualizadas
 * WebSocket event: 'dashboard:stats'
 */
export class DashboardStatsEvent {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;
}
