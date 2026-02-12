import { Card } from '@components/ui'
import { DashboardStatsDto } from '@types/index'
import { Skeleton } from '@components/ui'

interface StatsCardsProps {
  stats: DashboardStatsDto | null
  isLoading: boolean
}

interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color: string
  bgColor: string
  isLoading: boolean
}

function StatCard({ title, value, icon, color, bgColor, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton height="h-4" width="w-24" className="mb-2" />
            <Skeleton height="h-8" width="w-16" />
          </div>
          <Skeleton variant="circular" width="w-12" height="h-12" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-full`}>
          <i className={`${icon} text-2xl ${color}`} aria-hidden="true"></i>
        </div>
      </div>
    </Card>
  )
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total de Tickets',
      value: stats?.totalTickets || 0,
      icon: 'pi pi-ticket',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Em Atendimento',
      value: stats?.inProgress || 0,
      icon: 'pi pi-users',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Na Fila',
      value: stats?.inQueue || 0,
      icon: 'pi pi-clock',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Finalizados',
      value: stats?.completed || 0,
      icon: 'pi pi-check-circle',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
