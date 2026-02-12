import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const socket: Socket = io(`${SOCKET_URL}/ws`, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
})

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
  }
}

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
  }
}

socket.on('connect', () => {
  console.log('[Socket.IO] Conectado ao servidor')
})

socket.on('disconnect', (reason) => {
  console.log('[Socket.IO] Desconectado:', reason)
})

socket.on('connect_error', (error) => {
  console.error('[Socket.IO] Erro de conexão:', error.message)
})

socket.on('reconnect', (attemptNumber) => {
  console.log(`[Socket.IO] Reconectado após ${attemptNumber} tentativa(s)`)
})

socket.on('reconnect_failed', () => {
  console.error('[Socket.IO] Falha ao reconectar')
})
