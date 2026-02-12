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
    <header className="bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/ubots-icon.png"
                alt="Ubots icon"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">FlowPay</h1>
                <p className="text-xs text-slate-500 font-medium">Dashboard em Tempo Real</p>
              </div>
            </Link>
          </div>

          <nav className="flex items-center justify-end gap-4 sm:gap-6">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}
                aria-label={isConnected ? 'Conectado' : 'Desconectado'}
              ></span>
              <span className="text-sm text-slate-600 font-medium">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-slate-600">
              <i className="pi pi-clock text-sm"></i>
              <span className="text-sm font-mono">{formatTime(currentTime)}</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
