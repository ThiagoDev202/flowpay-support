import { Card, Badge, Skeleton } from '@components/ui'
import { TicketResponseDto, TicketSubject } from '@/types'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RecentTicketsProps {
  tickets: TicketResponseDto[]
  isLoading: boolean
  onCompleteTicket: (id: string) => Promise<void>
  isUpdatingTicket: boolean
}

export function RecentTickets({
  tickets,
  isLoading,
  onCompleteTicket,
  isUpdatingTicket,
}: RecentTicketsProps) {
  const subjectLabels: Record<TicketSubject, string> = {
    CARD_PROBLEM: 'Problema com Cartão',
    LOAN_REQUEST: 'Solicitação de Empréstimo',
    OTHER: 'Outros',
  }

  const customerTemplate = (ticket: TicketResponseDto) => {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <i className="pi pi-user text-blue-600 text-sm"></i>
        </div>
        <span className="font-medium text-gray-900">{ticket.customerName}</span>
      </div>
    )
  }

  const subjectTemplate = (ticket: TicketResponseDto) => {
    return (
      <span className="text-sm text-gray-700">{subjectLabels[ticket.subject]}</span>
    )
  }

  const statusTemplate = (ticket: TicketResponseDto) => {
    return <Badge status={ticket.status} />
  }

  const agentTemplate = (ticket: TicketResponseDto) => {
    if (!ticket.agent) {
      return <span className="text-xs text-gray-400 italic">Não atribuído</span>
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <i className="pi pi-user text-green-600 text-xs"></i>
        </div>
        <span className="text-sm text-gray-700">{ticket.agent.name}</span>
      </div>
    )
  }

  const timeTemplate = (ticket: TicketResponseDto) => {
    const date = new Date(ticket.createdAt)
    const timeAgo = formatDistanceToNow(date, { locale: ptBR, addSuffix: true })

    return (
      <span className="text-xs text-gray-500" title={date.toLocaleString('pt-BR')}>
        {timeAgo}
      </span>
    )
  }

  const actionsTemplate = (ticket: TicketResponseDto) => {
    if (ticket.status !== 'IN_PROGRESS') {
      return <span className="text-xs text-gray-400">-</span>
    }

    return (
      <button
        type="button"
        onClick={() => void onCompleteTicket(ticket.id)}
        disabled={isUpdatingTicket}
        className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
      >
        Concluir
      </button>
    )
  }

  if (isLoading) {
    return (
      <Card title="Tickets Recentes" subtitle="Últimos 10 tickets criados">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton variant="circular" width="w-8" height="h-8" />
              <div className="flex-1">
                <Skeleton height="h-4" width="w-3/4" className="mb-2" />
                <Skeleton height="h-3" width="w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <Card title="Tickets Recentes" subtitle={`${recentTickets.length} últimos tickets`}>
      {recentTickets.length > 0 ? (
        <DataTable
          value={recentTickets}
          stripedRows
          showGridlines
          size="small"
          className="text-sm"
          emptyMessage="Nenhum ticket encontrado"
        >
          <Column
            field="customerName"
            header="Cliente"
            body={customerTemplate}
            style={{ minWidth: '200px' }}
          />
          <Column
            field="subject"
            header="Assunto"
            body={subjectTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            field="status"
            header="Status"
            body={statusTemplate}
            style={{ minWidth: '140px' }}
          />
          <Column
            field="agent"
            header="Atendente"
            body={agentTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            field="createdAt"
            header="Tempo"
            body={timeTemplate}
            style={{ minWidth: '140px' }}
          />
          <Column
            header="Ações"
            body={actionsTemplate}
            style={{ minWidth: '110px' }}
          />
        </DataTable>
      ) : (
        <div className="text-center py-8">
          <i className="pi pi-inbox text-4xl text-gray-300 mb-2"></i>
          <p className="text-gray-500 text-sm">Nenhum ticket criado ainda</p>
        </div>
      )}
    </Card>
  )
}
