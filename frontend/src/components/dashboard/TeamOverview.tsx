import { Card, Skeleton } from '@components/ui'
import { TeamSummaryDto, TeamType } from '@/types'

interface TeamOverviewProps {
  teams: TeamSummaryDto[]
  isLoading: boolean
}

interface TeamCardProps {
  team: TeamSummaryDto
}

interface TickerCardProps {
  teams: TeamSummaryDto[]
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
    <Card className="h-full min-h-[230px] hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4 h-full">
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

function TickerCard({ teams }: TickerCardProps) {
  const totalQueue = teams.reduce((sum, team) => sum + team.queueSize, 0)
  const totalActive = teams.reduce((sum, team) => sum + team.activeTickets, 0)
  const totalAgents = teams.reduce((sum, team) => sum + team.totalAgents, 0)
  const totalAvailable = teams.reduce((sum, team) => sum + team.availableAgents, 0)

  const busiestTeam =
    teams.length > 0
      ? [...teams].sort((a, b) => b.activeTickets + b.queueSize - (a.activeTickets + a.queueSize))[0]
      : null

  return (
    <Card className="h-full min-h-[230px] bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-blue-100">
      <div className="space-y-4 h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Ticker Operacional</p>
            <h3 className="text-lg font-semibold text-slate-900 mt-1">Visão Rápida</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-chart-line text-blue-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-slate-500">Fila total</p>
            <p className="text-2xl font-bold text-amber-600">{totalQueue}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-slate-500">Ativos</p>
            <p className="text-2xl font-bold text-blue-600">{totalActive}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-slate-500">Disponíveis</p>
            <p className="text-2xl font-bold text-emerald-600">{totalAvailable}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-slate-500">Capacidade</p>
            <p className="text-2xl font-bold text-slate-700">{totalAgents}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="text-slate-500">Time com maior carga: </span>
          <span className="font-semibold text-slate-800">{busiestTeam?.teamName || 'N/A'}</span>
        </div>
      </div>
    </Card>
  )
}

export function TeamOverview({ teams, isLoading }: TeamOverviewProps) {
  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch auto-rows-fr">
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

  const shouldShowTicker = teams.length < 3
  const orderedTeams = [
    ...teams.filter((team) => team.teamType === TeamType.CARDS),
    ...teams.filter((team) => team.teamType === TeamType.LOANS),
    ...teams.filter((team) => team.teamType === TeamType.OTHER),
  ]

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch auto-rows-fr">
      {orderedTeams.map((team, index) => (
        <TeamCard key={team.teamId || `${team.teamType}-${index}`} team={team} />
      ))}
      {shouldShowTicker && <TickerCard teams={teams} />}
    </div>
  )
}
