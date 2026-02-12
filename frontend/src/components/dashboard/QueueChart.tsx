import { Card, Skeleton } from '@components/ui'
import { TeamSummaryDto } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react'

interface QueueChartProps {
  teams: TeamSummaryDto[]
  isLoading: boolean
}

interface QueueDataPoint {
  time: string
  cards: number
  loans: number
  other: number
}

export function QueueChart({ teams, isLoading }: QueueChartProps) {
  const [queueHistory, setQueueHistory] = useState<QueueDataPoint[]>([])

  useEffect(() => {
    if (teams.length === 0) return

    const now = new Date()
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const newDataPoint: QueueDataPoint = {
      time: timeString,
      cards: teams.find((t) => t.teamType === 'CARDS')?.queueSize || 0,
      loans: teams.find((t) => t.teamType === 'LOANS')?.queueSize || 0,
      other: teams.find((t) => t.teamType === 'OTHER')?.queueSize || 0,
    }

    setQueueHistory((prev) => {
      const updated = [...prev, newDataPoint]
      // Manter apenas os últimos 20 pontos
      if (updated.length > 20) {
        return updated.slice(-20)
      }
      return updated
    })
  }, [teams])

  if (isLoading) {
    return (
      <Card title="Evolução da Fila" subtitle="Últimos 20 pontos">
        <div className="h-80 flex items-center justify-center">
          <Skeleton height="h-64" className="w-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card title="Evolução da Fila" subtitle="Acompanhamento em tempo real">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={queueHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="cards"
              name="Cartões"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="loans"
              name="Empréstimos"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="other"
              name="Outros"
              stroke="#6b7280"
              strokeWidth={2}
              dot={{ fill: '#6b7280', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {queueHistory.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Aguardando dados...</p>
        </div>
      )}
    </Card>
  )
}
