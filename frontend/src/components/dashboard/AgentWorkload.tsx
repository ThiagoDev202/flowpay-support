import { Card, Skeleton } from '@components/ui'
import { AgentResponseDto, TeamType } from '@/types'
import { ProgressBar } from 'primereact/progressbar'

interface AgentWorkloadProps {
  agents: AgentResponseDto[]
  isLoading: boolean
  onToggleStatus: (id: string, isOnline: boolean) => Promise<void>
  isUpdatingAgent: boolean
}

interface AgentItemProps {
  agent: AgentResponseDto
  onToggleStatus: (id: string, isOnline: boolean) => Promise<void>
  isUpdatingAgent: boolean
}

function AgentItem({ agent, onToggleStatus, isUpdatingAgent }: AgentItemProps) {
  const workloadPercentage = (agent.activeTicketsCount / agent.maxConcurrent) * 100

  const teamColorConfig: Record<TeamType, string> = {
    CARDS: 'bg-blue-100 text-blue-700',
    LOANS: 'bg-green-100 text-green-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }

  const statusColor = agent.isOnline ? 'bg-green-500' : 'bg-gray-400'

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#ef4444' // red-500
    if (percentage >= 66) return '#f59e0b' // amber-500
    if (percentage >= 33) return '#3b82f6' // blue-500
    return '#10b981' // green-500
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <i className="pi pi-user text-gray-600"></i>
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-white`}
            aria-label={agent.isOnline ? 'Online' : 'Offline'}
          ></span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{agent.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${teamColorConfig[agent.team.type]}`}>
            {agent.team.name}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">
            {agent.activeTicketsCount}/{agent.maxConcurrent}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span
            className={`text-xs ${agent.isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}`}
          >
            {agent.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <ProgressBar
          value={workloadPercentage}
          showValue={false}
          style={{ height: '8px' }}
          color={getProgressColor(workloadPercentage)}
          aria-label={`Carga de trabalho: ${workloadPercentage.toFixed(0)}%`}
        />
      </div>

      <button
        type="button"
        onClick={() => void onToggleStatus(agent.id, !agent.isOnline)}
        disabled={isUpdatingAgent}
        className={`px-2 py-1 text-xs rounded ${
          agent.isOnline
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-60`}
      >
        {agent.isOnline ? 'Offline' : 'Online'}
      </button>
    </div>
  )
}

export function AgentWorkload({
  agents,
  isLoading,
  onToggleStatus,
  isUpdatingAgent,
}: AgentWorkloadProps) {
  if (isLoading) {
    return (
      <Card title="Carga de Trabalho dos Atendentes" subtitle="Capacidade individual">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width="w-10" height="h-10" />
                <div className="flex-1">
                  <Skeleton height="h-4" width="w-32" className="mb-2" />
                  <Skeleton height="h-2" width="w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const sortedAgents = [...agents].sort((a, b) => {
    // Online primeiro
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    // Depois por carga de trabalho (decrescente)
    return b.activeTicketsCount - a.activeTicketsCount
  })

  return (
    <Card
      title="Carga de Trabalho dos Atendentes"
      subtitle={`${agents.filter((a) => a.isOnline).length} de ${agents.length} atendentes online`}
      className="h-full"
    >
      <div className="space-y-3 h-[380px] overflow-y-auto pr-1">
        {sortedAgents.length > 0 ? (
          sortedAgents.map((agent) => (
            <AgentItem
              key={agent.id}
              agent={agent}
              onToggleStatus={onToggleStatus}
              isUpdatingAgent={isUpdatingAgent}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <i className="pi pi-users text-4xl text-gray-300 mb-2"></i>
            <p className="text-gray-500 text-sm">Nenhum atendente cadastrado</p>
          </div>
        )}
      </div>
    </Card>
  )
}
