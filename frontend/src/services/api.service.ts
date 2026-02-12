import { api } from '@lib/axios'
import type {
  CreateTicketDto,
  TicketResponseDto,
  AgentResponseDto,
  TeamResponseDto,
  DashboardStatsDto,
  TeamSummaryDto,
} from '@/types'

export class ApiService {
  static async getDashboardStats(): Promise<DashboardStatsDto> {
    const { data } = await api.get<DashboardStatsDto>('/dashboard/stats')
    return data
  }

  static async getDashboardTeams(): Promise<TeamSummaryDto[]> {
    const { data } = await api.get<TeamSummaryDto[]>('/dashboard/teams')
    return data
  }

  static async getTeams(): Promise<TeamResponseDto[]> {
    const { data } = await api.get<TeamResponseDto[]>('/teams')
    return data
  }

  static async getTeamById(id: string): Promise<TeamResponseDto> {
    const { data } = await api.get<TeamResponseDto>(`/teams/${id}`)
    return data
  }

  static async getAgents(): Promise<AgentResponseDto[]> {
    const { data } = await api.get<AgentResponseDto[]>('/agents')
    return data
  }

  static async getAgentById(id: string): Promise<AgentResponseDto> {
    const { data } = await api.get<AgentResponseDto>(`/agents/${id}`)
    return data
  }

  static async updateAgentStatus(id: string, isOnline: boolean): Promise<AgentResponseDto> {
    const { data } = await api.patch<AgentResponseDto>(`/agents/${id}/status`, { isOnline })
    return data
  }

  static async getTickets(): Promise<TicketResponseDto[]> {
    const { data } = await api.get<TicketResponseDto[]>('/tickets')
    return data
  }

  static async getTicketById(id: string): Promise<TicketResponseDto> {
    const { data } = await api.get<TicketResponseDto>(`/tickets/${id}`)
    return data
  }

  static async createTicket(ticketData: CreateTicketDto): Promise<TicketResponseDto> {
    const { data } = await api.post<TicketResponseDto>('/tickets', ticketData)
    return data
  }

  static async completeTicket(id: string): Promise<TicketResponseDto> {
    const { data } = await api.patch<TicketResponseDto>(`/tickets/${id}/complete`)
    return data
  }

  static async getRecentTickets(limit = 10): Promise<TicketResponseDto[]> {
    const { data } = await api.get<TicketResponseDto[]>('/tickets', {
      params: { limit, orderBy: 'createdAt:desc' },
    })
    return data
  }

  static async getQueueByTeam(teamType: string): Promise<TicketResponseDto[]> {
    const subjectByTeam: Record<string, string> = {
      CARDS: 'CARD_PROBLEM',
      LOANS: 'LOAN_REQUEST',
      OTHER: 'OTHER',
    }
    const { data } = await api.get<TicketResponseDto[]>('/tickets', {
      params: { status: 'WAITING', subject: subjectByTeam[teamType] || 'OTHER' },
    })
    return data
  }
}
