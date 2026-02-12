import { TicketStatus } from '@/types'

interface BadgeProps {
  status: TicketStatus
  className?: string
}

export function Badge({ status, className = '' }: BadgeProps) {
  const statusConfig = {
    WAITING: {
      label: 'Na Fila',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    IN_PROGRESS: {
      label: 'Em Atendimento',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    COMPLETED: {
      label: 'Finalizado',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className} ${className}`}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
