interface RealTimeIndicatorProps {
  isConnected: boolean
  className?: string
}

export function RealTimeIndicator({ isConnected, className = '' }: RealTimeIndicatorProps) {
  const status = isConnected ? 'connected' : 'disconnected'

  const statusConfig = {
    connected: {
      icon: 'pi pi-check-circle',
      label: 'Conectado',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    disconnected: {
      icon: 'pi pi-times-circle',
      label: 'Desconectado',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${config.bgColor} ${config.borderColor} ${className}`}
      role="status"
      aria-live="polite"
    >
      <i className={`${config.icon} text-base ${config.color}`} aria-hidden="true" />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      {isConnected && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
    </div>
  )
}
