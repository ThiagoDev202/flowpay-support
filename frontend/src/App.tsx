import { FormEvent, useState } from 'react'
import { Header } from '@components/layout/Header'
import { PageContainer } from '@components/layout/PageContainer'
import { RealTimeIndicator } from '@components/dashboard/RealTimeIndicator'
import { StatsCards } from '@components/dashboard/StatsCards'
import { TeamOverview } from '@components/dashboard/TeamOverview'
import { QueueChart } from '@components/dashboard/QueueChart'
import { AgentWorkload } from '@components/dashboard/AgentWorkload'
import { RecentTickets } from '@components/dashboard/RecentTickets'
import { useDashboard } from '@hooks/useDashboard'
import { TicketSubject } from '@/types'

export function App() {
  const {
    stats,
    teams,
    tickets,
    agents,
    isConnected,
    isLoading,
    isSubmittingTicket,
    isUpdatingTicket,
    isUpdatingAgent,
    createTicket,
    completeTicket,
    updateAgentStatus,
    refetch,
  } = useDashboard()
  const [customerName, setCustomerName] = useState('')
  const [subject, setSubject] = useState<TicketSubject>(TicketSubject.CARD_PROBLEM)

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (customerName.trim().length < 3) return

    await createTicket({
      customerName: customerName.trim(),
      subject,
    })

    setCustomerName('')
    setSubject(TicketSubject.CARD_PROBLEM)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isConnected={isConnected} />

      <main className="flex-1 w-full">
        <PageContainer>
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Acompanhamento em tempo real</p>
              </div>
              <div className="flex items-center gap-4">
                <RealTimeIndicator isConnected={isConnected} />
                <button
                  onClick={refetch}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Atualizar dados"
                >
                  <i className="pi pi-refresh"></i>
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <section aria-label="Estatísticas principais">
              <StatsCards stats={stats} isLoading={isLoading} />
            </section>

            {/* Team Overview */}
            <section aria-label="Visão geral dos times">
              <TeamOverview teams={teams} isLoading={isLoading} />
            </section>

            <section aria-label="Criar ticket">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Criar Novo Ticket
                </h2>
                <form onSubmit={(event) => void handleCreateTicket(event)} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as TicketSubject)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value={TicketSubject.CARD_PROBLEM}>Problema com cartão</option>
                    <option value={TicketSubject.LOAN_REQUEST}>Contratação de empréstimo</option>
                    <option value={TicketSubject.OTHER}>Outros assuntos</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {isSubmittingTicket ? 'Criando...' : 'Criar Ticket'}
                  </button>
                </form>
              </div>
            </section>

            {/* Charts and Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Queue Chart */}
              <section aria-label="Gráfico de evolução da fila">
                <QueueChart teams={teams} isLoading={isLoading} />
              </section>

              {/* Agent Workload */}
              <section aria-label="Carga de trabalho dos atendentes">
                <AgentWorkload
                  agents={agents}
                  isLoading={isLoading}
                  onToggleStatus={updateAgentStatus}
                  isUpdatingAgent={isUpdatingAgent}
                />
              </section>
            </div>

            {/* Recent Tickets */}
            <section aria-label="Tickets recentes">
              <RecentTickets
                tickets={tickets}
                isLoading={isLoading}
                onCompleteTicket={completeTicket}
                isUpdatingTicket={isUpdatingTicket}
              />
            </section>
          </div>
        </PageContainer>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            FlowPay Support - Sistema de Distribuição de Atendimentos
          </p>
        </div>
      </footer>
    </div>
  )
}
