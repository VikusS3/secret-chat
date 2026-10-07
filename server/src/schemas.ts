import { z } from 'zod'

const roomIdSchema = z.string().min(1).max(64)
const messageIdSchema = z.string().min(1).max(64)

export const joinSchema = z.object({
  roomId: roomIdSchema,
})

export const setTimerSchema = z.object({
  roomId: roomIdSchema,
  seconds: z.number().int().min(1).max(60),
})

export const sendMessageSchema = z.object({
  roomId: roomIdSchema,
  text: z.string().min(1).max(1000),
})

export const revealSchema = z.object({
  roomId: roomIdSchema,
  messageId: messageIdSchema,
})
