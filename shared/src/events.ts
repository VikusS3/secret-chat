import type { MessageStatus } from './models.js'

export interface ClientToServerEvents {
  'room:join': (payload: { roomId: string }) => void
  'room:set_timer': (payload: { roomId: string; seconds: number }) => void
  'message:send': (payload: { roomId: string; text: string }) => void
  'message:reveal': (payload: { roomId: string; messageId: string }) => void
}

export interface ServerToClientEvents {
  'room:info': (payload: { participantsCount: number; timerSeconds: number }) => void
  'room:error': (payload: { message: string }) => void
  'message:new': (payload: { id: string; senderId: string; status: MessageStatus }) => void
  'message:revealed': (payload: { id: string; text?: string; expiresAt: string }) => void
  'message:destroyed': (payload: { id: string }) => void
}

export interface InterServerEvents {}

export interface SocketData {}
