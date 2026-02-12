import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  TicketCreatedEvent,
  TicketAssignedEvent,
  TicketCompletedEvent,
  QueueUpdatedEvent,
  AgentStatusChangedEvent,
  DashboardStatsEvent,
} from './dto/websocket-events.dto';
import { TeamType } from '@prisma/client';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { AgentResponseDto } from '@/modules/agents/dto/agent-response.dto';

/**
 * WebSocket Gateway para comunicação em tempo real
 * Tarefa 4.1: Configuração do Gateway com Socket.IO
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class TicketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TicketsGateway.name);

  /**
   * Lifecycle: Inicialização do Gateway
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.logger.log('Namespace: /ws');
    this.logger.log('CORS enabled for: http://localhost:5173, http://localhost:3000');
  }

  /**
   * Lifecycle: Cliente conectado
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Lifecycle: Cliente desconectado
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Helper: Emite evento para todos os clientes conectados
   */
  private emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Emitted event '${event}' to all clients`);
  }

  /**
   * Tarefa 4.2: Evento ticket:created
   * Emitido quando um novo ticket é criado
   */
  emitTicketCreated(ticket: TicketResponseDto): void {
    const event: TicketCreatedEvent = {
      ticket,
      queuePosition: ticket.queuePosition,
    };

    this.emitToAll('ticket:created', event);
    this.logger.log(
      `Ticket created event emitted: ${ticket.id} (${ticket.subject})`,
    );
  }

  /**
   * Tarefa 4.2: Evento ticket:assigned
   * Emitido quando um ticket é atribuído a um agente
   */
  emitTicketAssigned(
    ticket: TicketResponseDto,
    agent: AgentResponseDto,
  ): void {
    const event: TicketAssignedEvent = {
      ticket,
      agent,
    };

    this.emitToAll('ticket:assigned', event);
    this.logger.log(
      `Ticket assigned event emitted: ${ticket.id} → Agent ${agent.name}`,
    );
  }

  /**
   * Tarefa 4.3: Evento ticket:completed
   * Emitido quando um ticket é completado
   */
  emitTicketCompleted(
    ticket: TicketResponseDto,
    agent: AgentResponseDto,
  ): void {
    const event: TicketCompletedEvent = {
      ticket,
      agent,
    };

    this.emitToAll('ticket:completed', event);
    this.logger.log(
      `Ticket completed event emitted: ${ticket.id} by Agent ${agent.name}`,
    );
  }

  /**
   * Tarefa 4.3: Evento queue:updated
   * Emitido quando a fila é atualizada
   */
  emitQueueUpdated(teamType: TeamType, queueSize: number): void {
    const event: QueueUpdatedEvent = {
      teamType,
      queueSize,
    };

    this.emitToAll('queue:updated', event);
    this.logger.log(
      `Queue updated event emitted: ${teamType} queue size = ${queueSize}`,
    );
  }

  /**
   * Tarefa 4.4: Evento agent:status-changed
   * Emitido quando o status de um agente muda
   */
  emitAgentStatusChanged(agent: AgentResponseDto, activeCount: number): void {
    const event: AgentStatusChangedEvent = {
      agent,
      activeCount,
    };

    this.emitToAll('agent:status-changed', event);
    this.logger.log(
      `Agent status changed event emitted: ${agent.name} (online: ${agent.isOnline}, active: ${activeCount})`,
    );
  }

  /**
   * Tarefa 4.5: Evento dashboard:stats
   * Emitido quando as estatísticas do dashboard são atualizadas
   */
  emitDashboardStats(stats: DashboardStatsEvent['stats']): void {
    const event: DashboardStatsEvent = {
      stats,
    };

    this.emitToAll('dashboard:stats', event);
    this.logger.debug(
      `Dashboard stats event emitted: ${stats.totalTickets} total tickets`,
    );
  }
}
