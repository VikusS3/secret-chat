export type MessageStatus = 'hidden' | 'revealed' | 'destroyed'

export interface Room {
  id: string
  participants: string[]
  timerSeconds: number
  createdAt: Date
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  text: string
  status: MessageStatus
  revealedAt?: Date
}
