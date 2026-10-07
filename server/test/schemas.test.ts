import { describe, expect, it } from 'vitest'
import { joinSchema, revealSchema, sendMessageSchema, setTimerSchema } from '../src/schemas.js'

describe('schemas de eventos', () => {
  it('joinSchema acepta roomId de1 a 64 caracteres', () => {
    expect(joinSchema.safeParse({ roomId: 'sala-1' }).success).toBe(true)
    expect(joinSchema.safeParse({ roomId: '' }).success).toBe(false)
    expect(joinSchema.safeParse({ roomId: 'x'.repeat(65) }).success).toBe(false)
    expect(joinSchema.safeParse({}).success).toBe(false)
  })

  it('setTimerSchema solo admite enteros entre 1 y 60', () => {
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: 3 }).success).toBe(true)
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: 60 }).success).toBe(true)
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: 0 }).success).toBe(false)
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: 61 }).success).toBe(false)
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: 2.5 }).success).toBe(false)
    expect(setTimerSchema.safeParse({ roomId: 's', seconds: '10' }).success).toBe(false)
  })

  it('sendMessageSchema exige texto de 1 a 1000 caracteres', () => {
    expect(sendMessageSchema.safeParse({ roomId: 's', text: 'hola' }).success).toBe(true)
    expect(sendMessageSchema.safeParse({ roomId: 's', text: '' }).success).toBe(false)
    expect(sendMessageSchema.safeParse({ roomId: 's', text: 'x'.repeat(1001) }).success).toBe(false)
  })

  it('revealSchema exige roomId y messageId', () => {
    expect(revealSchema.safeParse({ roomId: 's', messageId: 'm' }).success).toBe(true)
    expect(revealSchema.safeParse({ roomId: 's' }).success).toBe(false)
    expect(revealSchema.safeParse({ messageId: 'm' }).success).toBe(false)
  })
})
