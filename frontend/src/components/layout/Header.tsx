import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface HeaderProps {
  isConnected?: boolean
}

export function Header({ isConnected = false }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white rounded-lg p-2">
                <i className="pi pi-chart-line text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FlowPay</h1>
                <p className="text-xs text-gray-500">Dashboard em Tempo Real</p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
                aria-label={isConnected ? 'Conectado' : 'Desconectado'}
              ></span>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <i className="pi pi-clock text-sm"></i>
              <span className="text-sm font-mono">{formatTime(currentTime)}</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
