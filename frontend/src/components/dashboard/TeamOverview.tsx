import { Card, Skeleton } from '@components/ui'
import { TeamSummaryDto, TeamType } from '@/types'

interface TeamOverviewProps {
  teams: TeamSummaryDto[]
  isLoading: boolean
}

interface TeamCardProps {
  team: TeamSummaryDto
}

function TeamCard({ team }: TeamCardProps) {
  const teamConfig: Record<TeamType, { color: string; bgColor: string; icon: string }> = {
    CARDS: {
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      icon: 'pi pi-credit-card',
    },
    LOANS: {
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      icon: 'pi pi-dollar',
    },
    OTHER: {
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      icon: 'pi pi-question-circle',
    },
  }

  const config =
    (team.teamType && teamConfig[team.teamType as TeamType]) || {
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      icon: 'pi pi-users',
    }
  const capacityPercentage = team.totalAgents > 0 ? (team.availableAgents / team.totalAgents) * 100 : 0

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${config.bgColor} p-3 rounded-lg`}>
              <i className={`${config.icon} text-xl ${config.color}`} aria-hidden="true"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{team.teamName}</h3>
              <p className="text-sm text-gray-500">Time {team.teamType}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Atendentes Disponíveis</p>
            <p className="text-2xl font-bold text-gray-900">
              {team.availableAgents}/{team.totalAgents}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Em Atendimento</p>
            <p className="text-2xl font-bold text-blue-600">{team.activeTickets}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fila de Espera</span>
            <span className={`font-semibold ${team.queueSize > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
              {team.queueSize} {team.queueSize === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Capacidade</span>
              <span>{capacityPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  capacityPercentage > 70
                    ? 'bg-green-500'
                    : capacityPercentage > 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${capacityPercentage}%` }}
                role="progressbar"
                aria-valuenow={capacityPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Capacidade disponível"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function TeamOverview({ teams, isLoading }: TeamOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="w-12" height="h-12" />
                <div className="flex-1">
                  <Skeleton height="h-5" width="w-32" className="mb-2" />
                  <Skeleton height="h-4" width="w-24" />
                </div>
              </div>
              <Skeleton height="h-20" />
              <Skeleton height="h-8" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {teams.map((team, index) => (
        <TeamCard key={team.teamId || `${team.teamType}-${index}`} team={team} />
      ))}
    </div>
  )
}
