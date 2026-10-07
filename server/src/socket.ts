import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import type { ClientToServerEvents, ServerToClientEvents } from '@secret-chat/shared'
import { ERR_INVALID_PAYLOAD, ERR_NOT_IN_ROOM } from '@secret-chat/shared'
import { joinSchema, revealSchema, sendMessageSchema, setTimerSchema } from './schemas.js'
import { ChatStore } from './store.js'

export interface ChatServer {
  io: Server<ClientToServerEvents, ServerToClientEvents>
  store: ChatStore
  close: () => Promise<void>
}

export function createChatServer(httpServer: HttpServer): ChatServer {
  const store = new ChatStore()
  const destroyTimers = new Map<string, NodeJS.Timeout>()

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    ...(process.env.NODE_ENV === 'production' ? {} : { cors: { origin: '*' } }),
    // Detecta sockets muertos sin señal (apps en background) en ≤15s, no en ~45s
    pingInterval: 10_000,
    pingTimeout: 5_000,
  })

  function scheduleDestroy(messageId: string, roomId: string, ms: number): void {
    const existing = destroyTimers.get(messageId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      destroyTimers.delete(messageId)
      const destroyed = store.destroyMessage(messageId)
      if (destroyed) {
        io.to(roomId).emit('message:destroyed', { id: messageId })
      }
    }, ms)
    destroyTimers.set(messageId, timer)
  }

  function cancelTimersByRoom(roomId: string): void {
    for (const [messageId, timer] of destroyTimers) {
      if (store.getMessage(messageId)?.roomId === roomId) {
        clearTimeout(timer)
        destroyTimers.delete(messageId)
      }
    }
  }

  io.on('connection', (socket) => {
    socket.on('room:join', (raw) => {
      const parsed = joinSchema.safeParse(raw)
      if (!parsed.success) {
        socket.emit('room:error', { message: ERR_INVALID_PAYLOAD })
        return
      }
      const result = store.joinRoom(parsed.data.roomId, socket.id)
      if ('error' in result) {
        socket.emit('room:error', { message: result.error })
        return
      }
      socket.join(parsed.data.roomId)
      io.to(parsed.data.roomId).emit('room:info', {
        participantsCount: result.room.participants.length,
        timerSeconds: result.room.timerSeconds,
      })
    })

    socket.on('room:set_timer', (raw) => {
      const parsed = setTimerSchema.safeParse(raw)
      if (!parsed.success) {
        socket.emit('room:error', { message: ERR_INVALID_PAYLOAD })
        return
      }
      const { roomId, seconds } = parsed.data
      if (!store.isParticipant(socket.id, roomId)) {
        socket.emit('room:error', { message: ERR_NOT_IN_ROOM })
        return
      }
      const room = store.setTimer(roomId, seconds)
      if (!room) {
        socket.emit('room:error', { message: ERR_NOT_IN_ROOM })
        return
      }
      io.to(roomId).emit('room:info', {
        participantsCount: room.participants.length,
        timerSeconds: room.timerSeconds,
      })
    })

    socket.on('message:send', (raw) => {
      const parsed = sendMessageSchema.safeParse(raw)
      if (!parsed.success) {
        socket.emit('room:error', { message: ERR_INVALID_PAYLOAD })
        return
      }
      const { roomId, text } = parsed.data
      if (!store.isParticipant(socket.id, roomId)) {
        socket.emit('room:error', { message: ERR_NOT_IN_ROOM })
        return
      }
      const message = store.addMessage(roomId, socket.id, text)
      io.to(roomId).emit('message:new', {
        id: message.id,
        senderId: message.senderId,
        status: message.status,
      })
    })

    socket.on('message:reveal', (raw) => {
      const parsed = revealSchema.safeParse(raw)
      if (!parsed.success) {
        socket.emit('room:error', { message: ERR_INVALID_PAYLOAD })
        return
      }
      const { roomId, messageId } = parsed.data
      if (!store.isParticipant(socket.id, roomId)) {
        socket.emit('room:error', { message: ERR_NOT_IN_ROOM })
        return
      }
      const revealed = store.revealMessage(messageId)
      if (!revealed) return
      const { message, expiresAt } = revealed
      io.to(roomId).emit('message:revealed', {
        id: message.id,
        text: message.text,
        expiresAt: expiresAt.toISOString(),
      })
      scheduleDestroy(message.id, roomId, expiresAt.getTime() - Date.now())
    })

    socket.on('disconnect', () => {
      const room = store.leaveRoom(socket.id)
      if (!room) return
      if (room.participants.length === 0) {
        cancelTimersByRoom(room.id)
        store.deleteRoom(room.id)
        return
      }
      io.to(room.id).emit('room:info', {
        participantsCount: room.participants.length,
        timerSeconds: room.timerSeconds,
      })
    })
  })

  async function close(): Promise<void> {
    for (const timer of destroyTimers.values()) clearTimeout(timer)
    destroyTimers.clear()
    await new Promise<void>((resolve) => {
      io.close(() => resolve())
    })
    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()))
      })
    }
  }

  return { io, store, close }
}
