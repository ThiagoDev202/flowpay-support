import { Header } from '@components/layout/Header'
import { PageContainer } from '@components/layout/PageContainer'
import { RealTimeIndicator } from '@components/dashboard/RealTimeIndicator'
import { StatsCards } from '@components/dashboard/StatsCards'
import { TeamOverview } from '@components/dashboard/TeamOverview'
import { QueueChart } from '@components/dashboard/QueueChart'
import { AgentWorkload } from '@components/dashboard/AgentWorkload'
import { RecentTickets } from '@components/dashboard/RecentTickets'
import { useDashboard } from '@hooks/useDashboard'

export function App() {
  const { stats, teams, tickets, agents, isConnected, isLoading, refetch } = useDashboard()

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

            {/* Charts and Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Queue Chart */}
              <section aria-label="Gráfico de evolução da fila">
                <QueueChart teams={teams} isLoading={isLoading} />
              </section>

              {/* Agent Workload */}
              <section aria-label="Carga de trabalho dos atendentes">
                <AgentWorkload agents={agents} isLoading={isLoading} />
              </section>
            </div>

            {/* Recent Tickets */}
            <section aria-label="Tickets recentes">
              <RecentTickets tickets={tickets} isLoading={isLoading} />
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
