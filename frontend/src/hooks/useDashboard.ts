import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSocket } from './useSocket'
import { ApiService } from '@services/api.service'
import type {
  DashboardStatsDto,
  TeamSummaryDto,
  TicketResponseDto,
  AgentResponseDto,
  TicketCreatedEvent,
  TicketAssignedEvent,
  TicketCompletedEvent,
  QueueUpdatedEvent,
  AgentStatusChangedEvent,
  DashboardStatsEvent,
} from '@types/index'

export function useDashboard() {
  const { isConnected, on, off } = useSocket()

  // Estados locais para dados em tempo real
  const [stats, setStats] = useState<DashboardStatsDto | null>(null)
  const [teams, setTeams] = useState<TeamSummaryDto[]>([])
  const [tickets, setTickets] = useState<TicketResponseDto[]>([])
  const [agents, setAgents] = useState<AgentResponseDto[]>([])

  // Query para buscar stats iniciais
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: ApiService.getDashboardStats,
    refetchInterval: 30000, // Refetch a cada 30s como fallback
  })

  // Query para buscar teams summary
  const teamsQuery = useQuery({
    queryKey: ['dashboard', 'teams'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/dashboard/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      return response.json() as Promise<TeamSummaryDto[]>
    },
    refetchInterval: 30000,
  })

  // Query para buscar tickets
  const ticketsQuery = useQuery({
    queryKey: ['tickets'],
    queryFn: ApiService.getTickets,
    refetchInterval: 30000,
  })

  // Query para buscar agents
  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: ApiService.getAgents,
    refetchInterval: 30000,
  })

  // Atualizar estados quando queries retornam
  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data)
    }
  }, [statsQuery.data])

  useEffect(() => {
    if (teamsQuery.data) {
      setTeams(teamsQuery.data)
    }
  }, [teamsQuery.data])

  useEffect(() => {
    if (ticketsQuery.data) {
      setTickets(ticketsQuery.data)
    }
  }, [ticketsQuery.data])

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data)
    }
  }, [agentsQuery.data])

  // WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return

    // ticket:created - Adiciona novo ticket
    const handleTicketCreated = (event: TicketCreatedEvent) => {
      console.log('[useDashboard] ticket:created', event)
      setTickets((prev) => [event.ticket, ...prev])

      // Atualizar stats
      setStats((prev) => prev ? {
        ...prev,
        totalTickets: prev.totalTickets + 1,
        inQueue: event.ticket.status === 'WAITING' ? prev.inQueue + 1 : prev.inQueue,
        inProgress: event.ticket.status === 'IN_PROGRESS' ? prev.inProgress + 1 : prev.inProgress,
      } : null)
    }

    // ticket:assigned - Atualiza ticket atribuído
    const handleTicketAssigned = (event: TicketAssignedEvent) => {
      console.log('[useDashboard] ticket:assigned', event)
      setTickets((prev) =>
        prev.map((t) => (t.id === event.ticket.id ? event.ticket : t))
      )

      // Atualizar stats
      setStats((prev) => prev ? {
        ...prev,
        inQueue: Math.max(0, prev.inQueue - 1),
        inProgress: prev.inProgress + 1,
      } : null)

      // Atualizar agente
      setAgents((prev) =>
        prev.map((a) => (a.id === event.agent.id ? event.agent : a))
      )
    }

    // ticket:completed - Marca ticket como completado
    const handleTicketCompleted = (event: TicketCompletedEvent) => {
      console.log('[useDashboard] ticket:completed', event)
      setTickets((prev) =>
        prev.map((t) => (t.id === event.ticket.id ? event.ticket : t))
      )

      // Atualizar stats
      setStats((prev) => prev ? {
        ...prev,
        inProgress: Math.max(0, prev.inProgress - 1),
        completed: prev.completed + 1,
      } : null)

      // Atualizar agente
      setAgents((prev) =>
        prev.map((a) => (a.id === event.agent.id ? event.agent : a))
      )
    }

    // queue:updated - Atualiza tamanho da fila
    const handleQueueUpdated = (event: QueueUpdatedEvent) => {
      console.log('[useDashboard] queue:updated', event)
      setTeams((prev) =>
        prev.map((team) =>
          team.type === event.teamType ? { ...team, queueSize: event.queueSize } : team
        )
      )
    }

    // agent:status-changed - Atualiza status do agente
    const handleAgentStatusChanged = (event: AgentStatusChangedEvent) => {
      console.log('[useDashboard] agent:status-changed', event)
      setAgents((prev) =>
        prev.map((a) => (a.id === event.agent.id ? event.agent : a))
      )
    }

    // dashboard:stats - Atualiza estatísticas completas
    const handleDashboardStats = (event: DashboardStatsEvent) => {
      console.log('[useDashboard] dashboard:stats', event)
      setStats(event.stats)
    }

    // Registrar listeners
    on<TicketCreatedEvent>('ticket:created', handleTicketCreated)
    on<TicketAssignedEvent>('ticket:assigned', handleTicketAssigned)
    on<TicketCompletedEvent>('ticket:completed', handleTicketCompleted)
    on<QueueUpdatedEvent>('queue:updated', handleQueueUpdated)
    on<AgentStatusChangedEvent>('agent:status-changed', handleAgentStatusChanged)
    on<DashboardStatsEvent>('dashboard:stats', handleDashboardStats)

    // Cleanup
    return () => {
      off('ticket:created')
      off('ticket:assigned')
      off('ticket:completed')
      off('queue:updated')
      off('agent:status-changed')
      off('dashboard:stats')
    }
  }, [isConnected, on, off])

  // Função para refetch manual
  const refetch = () => {
    statsQuery.refetch()
    teamsQuery.refetch()
    ticketsQuery.refetch()
    agentsQuery.refetch()
  }

  return {
    stats,
    teams,
    tickets,
    agents,
    isConnected,
    isLoading:
      statsQuery.isLoading ||
      teamsQuery.isLoading ||
      ticketsQuery.isLoading ||
      agentsQuery.isLoading,
    isError:
      statsQuery.isError ||
      teamsQuery.isError ||
      ticketsQuery.isError ||
      agentsQuery.isError,
    refetch,
  }
}
