import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy 'às' HH:mm"): string {
  return format(new Date(date), pattern, { locale: ptBR })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'agora'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m atrás`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d atrás`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    CARD_PROBLEM: 'Problemas com Cartão',
    LOAN_REQUEST: 'Solicitação de Empréstimo',
    OTHER: 'Outros Assuntos',
  }
  return labels[subject] || subject
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    WAITING: 'Aguardando',
    IN_PROGRESS: 'Em Atendimento',
    COMPLETED: 'Concluído',
  }
  return labels[status] || status
}

export function getTeamLabel(teamType: string): string {
  const labels: Record<string, string> = {
    CARDS: 'Cartões',
    LOANS: 'Empréstimos',
    OTHER: 'Outros Assuntos',
  }
  return labels[teamType] || teamType
}
