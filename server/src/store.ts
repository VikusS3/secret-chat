import { randomUUID } from 'node:crypto'
import type { Message, Room } from '@secret-chat/shared'

export const DEFAULT_TIMER_SECONDS = 5

export type JoinResult = { room: Room } | { error: string }

export class ChatStore {
  private rooms = new Map<string, Room>()
  private messages = new Map<string, Message>()
  private socketRoom = new Map<string, string>()

  joinRoom(roomId: string, socketId: string): JoinResult {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = {
        id: roomId,
        participants: [],
        timerSeconds: DEFAULT_TIMER_SECONDS,
        createdAt: new Date(),
      }
      this.rooms.set(roomId, room)
    }
    if (room.participants.length >= 2 && !room.participants.includes(socketId)) {
      return { error: 'La sala está llena' }
    }
    if (!room.participants.includes(socketId)) {
      room.participants.push(socketId)
    }
    this.socketRoom.set(socketId, roomId)
    return { room }
  }

  leaveRoom(socketId: string): Room | null {
    const roomId = this.socketRoom.get(socketId)
    if (!roomId) return null
    this.socketRoom.delete(socketId)
    const room = this.rooms.get(roomId)
    if (!room) return null
    room.participants = room.participants.filter((id) => id !== socketId)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketRoom.get(socketId)
    return roomId ? this.rooms.get(roomId) : undefined
  }

  isParticipant(socketId: string, roomId: string): boolean {
    return this.getRoomBySocket(socketId)?.id === roomId
  }

  setTimer(roomId: string, seconds: number): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null
    room.timerSeconds = seconds
    return room
  }

  addMessage(roomId: string, senderId: string, text: string): Message {
    const message: Message = {
      id: randomUUID(),
      roomId,
      senderId,
      text,
      status: 'hidden',
    }
    this.messages.set(message.id, message)
    return message
  }

  getMessage(messageId: string): Message | undefined {
    return this.messages.get(messageId)
  }

  getMessagesByRoom(roomId: string): Message[] {
    return [...this.messages.values()].filter((m) => m.roomId === roomId)
  }

  revealMessage(messageId: string): { message: Message; expiresAt: Date } | null {
    const message = this.messages.get(messageId)
    if (!message || message.status !== 'hidden') return null
    const room = this.rooms.get(message.roomId)
    if (!room) return null
    message.status = 'revealed'
    message.revealedAt = new Date()
    const expiresAt = new Date(Date.now() + room.timerSeconds * 1000)
    return { message, expiresAt }
  }

  destroyMessage(messageId: string): Message | null {
    const message = this.messages.get(messageId)
    if (!message) return null
    this.messages.delete(messageId)
    return message
  }

  deleteRoom(roomId: string): void {
    for (const message of this.getMessagesByRoom(roomId)) {
      this.messages.delete(message.id)
    }
    this.rooms.delete(roomId)
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId)
  }
}
