import { useCallback, useEffect, useState } from 'react'
import type { MessageStatus } from '@secret-chat/shared'
import { ERR_ROOM_FULL } from '@secret-chat/shared'
import { socket } from '../lib/socket'

const JOIN_RETRY_MS = 2000

export interface ChatMessage {
  id: string
  senderId: string
  text?: string
  status: MessageStatus
  isOwn: boolean
  expiresAt?: number
  durationMs?: number
  local?: boolean
}

export interface RoomInfo {
  participantsCount: number
  timerSeconds: number
}

export interface UseChatResult {
  messages: ChatMessage[]
  info: RoomInfo | null
  error: string | null
  connected: boolean
  sendMessage: (text: string) => void
  revealMessage: (messageId: string) => void
  setTimer: (seconds: number) => void
}

export function useChat(roomId: string): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [info, setInfo] = useState<RoomInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout> | undefined

    const onConnect = () => {
      setConnected(true)
      socket.emit('room:join', { roomId })
    }
    const onDisconnect = () => setConnected(false)
    const onInfo = (payload: RoomInfo) => {
      setInfo(payload)
      setError(null)
    }
    const onError = (payload: { message: string }) => {
      setError(payload.message)
      if (payload.message === ERR_ROOM_FULL) {
        retryTimeout = setTimeout(() => {
          socket.emit('room:join', { roomId })
        }, JOIN_RETRY_MS)
      }
    }

    const onNew = (payload: { id: string; senderId: string; status: MessageStatus }) => {
      setMessages((prev) => {
        const localIndex =
          payload.senderId === socket.id
            ? prev.findIndex((m) => m.local === true && m.senderId === payload.senderId)
            : -1
        if (localIndex >= 0) {
          return prev.map((m, i) => (i === localIndex ? { ...m, id: payload.id, local: false } : m))
        }
        return [
          ...prev,
          {
            id: payload.id,
            senderId: payload.senderId,
            status: payload.status,
            isOwn: payload.senderId === socket.id,
          },
        ]
      })
    }

    const onRevealed = (payload: { id: string; text?: string; expiresAt: string }) => {
      const expiresAt = Date.parse(payload.expiresAt)
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== payload.id) return m
          const revealed: ChatMessage = { ...m, status: 'revealed', expiresAt }
          if (payload.text !== undefined) revealed.text = payload.text
          if (revealed.durationMs === undefined) {
            revealed.durationMs = Math.max(expiresAt - Date.now(), 1)
          }
          return revealed
        }),
      )
    }

    const onDestroyed = (payload: { id: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, status: 'destroyed' } : m)),
      )
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('room:info', onInfo)
    socket.on('room:error', onError)
    socket.on('message:new', onNew)
    socket.on('message:revealed', onRevealed)
    socket.on('message:destroyed', onDestroyed)

    socket.connect()
    if (socket.connected) socket.emit('room:join', { roomId })

    return () => {
      if (retryTimeout !== undefined) clearTimeout(retryTimeout)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('room:info', onInfo)
      socket.off('room:error', onError)
      socket.off('message:new', onNew)
      socket.off('message:revealed', onRevealed)
      socket.off('message:destroyed', onDestroyed)
      socket.disconnect()
    }
  }, [roomId])

  const destroyedKey = messages
    .filter((m) => m.status === 'destroyed')
    .map((m) => m.id)
    .join(',')

  useEffect(() => {
    if (destroyedKey === '') return
    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.status !== 'destroyed'))
    }, 500)
    return () => clearTimeout(timer)
  }, [destroyedKey])

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed === '') return
      socket.emit('message:send', { roomId, text: trimmed })
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${crypto.randomUUID()}`,
          senderId: socket.id ?? 'local',
          text: trimmed,
          status: 'hidden',
          isOwn: true,
          local: true,
        },
      ])
    },
    [roomId],
  )

  const revealMessage = useCallback(
    (messageId: string) => {
      socket.emit('message:reveal', { roomId, messageId })
    },
    [roomId],
  )

  const setTimer = useCallback(
    (seconds: number) => {
      socket.emit('room:set_timer', { roomId, seconds })
    },
    [roomId],
  )

  return { messages, info, error, connected, sendMessage, revealMessage, setTimer }
}
