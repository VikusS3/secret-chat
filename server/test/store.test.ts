import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatStore, DEFAULT_TIMER_SECONDS } from '../src/store.js'

describe('ChatStore', () => {
  let store: ChatStore

  beforeEach(() => {
    store = new ChatStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('salas', () => {
    it('crea la sala en el primer join con el timer por defecto', () => {
      const result = store.joinRoom('sala-1', 'socket-a')
      expect('room' in result).toBe(true)
      if (!('room' in result)) return
      expect(result.room.timerSeconds).toBe(DEFAULT_TIMER_SECONDS)
      expect(result.room.participants).toEqual(['socket-a'])
    })

    it('acepta dos participantes y rechaza al tercero', () => {
      store.joinRoom('sala-1', 'socket-a')
      store.joinRoom('sala-1', 'socket-b')
      const third = store.joinRoom('sala-1', 'socket-c')
      expect('error' in third && third.error).toBe('La sala está llena')
    })

    it('no duplica participantes si el mismo socket repite join', () => {
      store.joinRoom('sala-1', 'socket-a')
      const again = store.joinRoom('sala-1', 'socket-a')
      expect('room' in again && again.room.participants).toEqual(['socket-a'])
    })

    it('leaveRoom elimina al socket y devuelve la sala', () => {
      store.joinRoom('sala-1', 'socket-a')
      store.joinRoom('sala-1', 'socket-b')
      const room = store.leaveRoom('socket-b')
      expect(room?.participants).toEqual(['socket-a'])
      expect(store.leaveRoom('socket-desconocido')).toBeNull()
    })

    it('setTimer actualiza timerSeconds', () => {
      store.joinRoom('sala-1', 'socket-a')
      const room = store.setTimer('sala-1', 10)
      expect(room?.timerSeconds).toBe(10)
      expect(store.setTimer('sala-inexistente', 3)).toBeNull()
    })
  })

  describe('mensajes y autodestrucción', () => {
    it('addMessage crea el mensaje oculto', () => {
      store.joinRoom('sala-1', 'socket-a')
      const message = store.addMessage('sala-1', 'socket-a', 'hola')
      expect(message.status).toBe('hidden')
      expect(message.text).toBe('hola')
      expect(store.getMessage(message.id)).toEqual(message)
    })

    it('revealMessage calcula expiresAt con el timer de la sala', () => {
      store.joinRoom('sala-1', 'socket-a')
      store.setTimer('sala-1', 5)
      const message = store.addMessage('sala-1', 'socket-a', 'hola')
      const revealed = store.revealMessage(message.id)
      expect(revealed).not.toBeNull()
      if (!revealed) return
      expect(revealed.message.status).toBe('revealed')
      expect(revealed.message.revealedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'))
      expect(revealed.expiresAt).toEqual(new Date('2026-01-01T00:00:05.000Z'))
    })

    it('revealMessage devuelve null si ya fue revelado', () => {
      store.joinRoom('sala-1', 'socket-a')
      const message = store.addMessage('sala-1', 'socket-a', 'hola')
      expect(store.revealMessage(message.id)).not.toBeNull()
      expect(store.revealMessage(message.id)).toBeNull()
      expect(store.revealMessage('id-inexistente')).toBeNull()
    })

    it('destroyMessage elimina el mensaje de la memoria', () => {
      store.joinRoom('sala-1', 'socket-a')
      const message = store.addMessage('sala-1', 'socket-a', 'hola')
      const destroyed = store.destroyMessage(message.id)
      expect(destroyed?.id).toBe(message.id)
      expect(store.getMessage(message.id)).toBeUndefined()
      expect(store.getMessagesByRoom('sala-1')).toEqual([])
    })

    it('deleteRoom elimina la sala y sus mensajes', () => {
      store.joinRoom('sala-1', 'socket-a')
      store.addMessage('sala-1', 'socket-a', 'uno')
      store.addMessage('sala-1', 'socket-a', 'dos')
      store.deleteRoom('sala-1')
      expect(store.hasRoom('sala-1')).toBe(false)
      expect(store.getMessagesByRoom('sala-1')).toEqual([])
    })
  })
})
