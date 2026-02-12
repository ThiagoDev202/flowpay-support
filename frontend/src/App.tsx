import { Header } from '@components/layout/Header'
import { PageContainer } from '@components/layout/PageContainer'
import { StatsCards } from '@components/dashboard/StatsCards'
import { TeamOverview } from '@components/dashboard/TeamOverview'
import { QueueChart } from '@components/dashboard/QueueChart'
import { AgentWorkload } from '@components/dashboard/AgentWorkload'
import { RecentTickets } from '@components/dashboard/RecentTickets'
import { useDashboard } from '@hooks/useDashboard'
import { Button } from 'primereact/button'

export function App() {
  const {
    stats,
    teams,
    tickets,
    agents,
    isConnected,
    isLoading,
    isUpdatingTicket,
    isUpdatingAgent,
    completeTicket,
    updateAgentStatus,
    refetch,
  } = useDashboard()

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header isConnected={isConnected} />

      <main className="flex-1 w-full">
        <PageContainer maxWidth="7xl" className="w-full">
          <div className="space-y-8 w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-slate-600 mt-1 text-base font-medium">Acompanhamento em tempo real</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={refetch}
                  label="Atualizar"
                  severity="secondary"
                  outlined
                  className="!h-10 !px-4 !rounded-lg !font-semibold !border-slate-300 !bg-white !text-slate-700 hover:!bg-slate-50 hover:!border-slate-400 hover:!text-slate-900 !shadow-sm !transition-colors"
                  aria-label="Atualizar dados"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <section aria-label="Estatísticas principais" className="w-full">
              <StatsCards stats={stats} isLoading={isLoading} />
            </section>

            {/* Team Overview */}
            <section aria-label="Visão geral dos times" className="w-full">
              <TeamOverview teams={teams} isLoading={isLoading} />
            </section>

            {/* Charts and Tables Grid */}
            <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">
              {/* Queue Chart */}
              <section aria-label="Gráfico de evolução da fila" className="h-full w-full lg:flex-1 min-w-0">
                <QueueChart teams={teams} isLoading={isLoading} />
              </section>

              {/* Agent Workload */}
              <section aria-label="Carga de trabalho dos atendentes" className="h-full w-full lg:flex-1 min-w-0">
                <AgentWorkload
                  agents={agents}
                  isLoading={isLoading}
                  onToggleStatus={updateAgentStatus}
                  isUpdatingAgent={isUpdatingAgent}
                />
              </section>
            </div>

            {/* Recent Tickets */}
            <section aria-label="Tickets recentes" className="w-full">
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
