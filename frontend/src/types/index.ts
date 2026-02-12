export enum TicketSubject {
  CARD_PROBLEM = 'CARD_PROBLEM',
  LOAN_REQUEST = 'LOAN_REQUEST',
  OTHER = 'OTHER',
}

export enum TicketStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TeamType {
  CARDS = 'CARDS',
  LOANS = 'LOANS',
  OTHER = 'OTHER',
}

export interface CreateTicketDto {
  customerName: string
  subject: TicketSubject
}

export interface TicketResponseDto {
  id: string
  customerName: string
  subject: TicketSubject
  status: TicketStatus
  agentId?: string
  agent?: {
    id: string
    name: string
  }
  queuePosition?: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AgentResponseDto {
  id: string
  name: string
  email: string
  teamId: string
  team: {
    id: string
    name: string
    type: TeamType
  }
  maxConcurrent: number
  activeTicketsCount: number
  isOnline: boolean
  createdAt: string
  updatedAt: string
}

export interface TeamResponseDto {
  id: string
  name: string
  type: TeamType
  agentsCount: number
  activeTicketsCount: number
  queueSize: number
  createdAt: string
  updatedAt: string
}

export interface DashboardStatsDto {
  totalTickets: number
  inProgress: number
  inQueue: number
  completed: number
  avgWaitTime: number
}

export interface TeamSummaryDto {
  id: string
  name: string
  type: TeamType
  activeTickets: number
  queueSize: number
  availableAgents: number
  totalAgents: number
}

export interface TicketCreatedEvent {
  ticket: TicketResponseDto
  queuePosition?: number
}

export interface TicketAssignedEvent {
  ticket: TicketResponseDto
  agent: AgentResponseDto
}

export interface TicketCompletedEvent {
  ticket: TicketResponseDto
  agent: AgentResponseDto
}

export interface QueueUpdatedEvent {
  teamType: TeamType
  queueSize: number
}

export interface AgentStatusChangedEvent {
  agent: AgentResponseDto
  activeCount: number
}

export interface DashboardStatsEvent {
  stats: DashboardStatsDto
}
