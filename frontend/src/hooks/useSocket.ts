import { useEffect, useState } from 'react'
import { socket, connectSocket, disconnectSocket } from '@lib/socket'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    connectSocket()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      disconnectSocket()
    }
  }, [])

  const emit = <T = unknown>(event: string, data?: T) => {
    socket.emit(event, data)
  }

  const on = <T = unknown>(event: string, handler: (data: T) => void) => {
    socket.on(event, handler)
  }

  const off = (event: string, handler?: (...args: unknown[]) => void) => {
    socket.off(event, handler)
  }

  return {
    socket,
    isConnected,
    emit,
    on,
    off,
  }
}
