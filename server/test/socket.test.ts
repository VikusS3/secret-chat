import { createServer } from 'node:http'
import type { Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ClientToServerEvents, ServerToClientEvents } from '@secret-chat/shared'
import { io as ioClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { app } from '../src/app.js'
import type { ChatServer } from '../src/socket.js'
import { createChatServer } from '../src/socket.js'

type Client = Socket<ServerToClientEvents, ClientToServerEvents>
type EventPayload<K extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[K]>[0]

function waitFor<K extends keyof ServerToClientEvents>(
  socket: Client,
  event: K,
): Promise<EventPayload<K>> {
  return new Promise((resolve) => {
    const listener = (emitted: string, payload: EventPayload<K>) => {
      if (emitted === event) {
        socket.offAny(listener)
        resolve(payload)
      }
    }
    socket.onAny(listener)
  })
}

describe('Socket.IO chat', () => {
  let httpServer: HttpServer
  let chat: ChatServer
  let baseUrl: string
  const clients: Client[] = []

  beforeEach(async () => {
    httpServer = createServer(app)
    chat = createChatServer(httpServer)
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const { port } = httpServer.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterEach(async () => {
    for (const client of clients) client.disconnect()
    clients.length = 0
    await chat.close()
  })

  async function connectClient(): Promise<Client> {
    const socket: Client = ioClient(baseUrl, {
      forceNew: true,
      transports: ['websocket'],
    })
    clients.push(socket)
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('connect_error', reject)
    })
    return socket
  }

  async function joinRoom(socket: Client, roomId: string): Promise<EventPayload<'room:info'>> {
    const info = waitFor(socket, 'room:info')
    socket.emit('room:join', { roomId })
    return info
  }

  const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  it('el primer join crea la sala y notifica 1 participante', async () => {
    const a = await connectClient()
    const info = await joinRoom(a, 'sala-1')
    expect(info).toEqual({ participantsCount: 1, timerSeconds: 5 })
    expect(chat.store.hasRoom('sala-1')).toBe(true)
  })

  it('rechaza al tercer participante con room:error', async () => {
    const a = await connectClient()
    const b = await connectClient()
    const c = await connectClient()
    await joinRoom(a, 'sala-2')
    await joinRoom(b, 'sala-2')

    const error = waitFor(c, 'room:error')
    c.emit('room:join', { roomId: 'sala-2' })
    expect(await error).toEqual({ message: 'La sala está llena' })
  })

  it('message:new se emite a la sala sin el texto del mensaje', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-3')
    await joinRoom(b, 'sala-3')

    const newA = waitFor(a, 'message:new')
    const newB = waitFor(b, 'message:new')
    a.emit('message:send', { roomId: 'sala-3', text: 'secreto ultra' })

    const [payloadA, payloadB] = await Promise.all([newA, newB])
    expect(payloadA).toEqual(payloadB)
    expect(payloadA.status).toBe('hidden')
    expect(payloadA.senderId).toBe(a.id)
    expect(JSON.stringify(payloadA)).not.toContain('secreto')
    expect(chat.store.getMessage(payloadA.id)?.text).toBe('secreto ultra')
  })

  it('room:set_timer actualiza la sala y notifica a ambos', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-4')
    await joinRoom(b, 'sala-4')

    const infoA = waitFor(a, 'room:info')
    const infoB = waitFor(b, 'room:info')
    a.emit('room:set_timer', { roomId: 'sala-4', seconds: 10 })

    const [rA, rB] = await Promise.all([infoA, infoB])
    expect(rA.timerSeconds).toBe(10)
    expect(rB.timerSeconds).toBe(10)
    expect(rA.participantsCount).toBe(2)
  })

  it('revela el mensaje y el servidor lo destruye al expirar el timer', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-5')
    await joinRoom(b, 'sala-5')

    const timerInfo = waitFor(a, 'room:info')
    a.emit('room:set_timer', { roomId: 'sala-5', seconds: 1 })
    await timerInfo

    const newMessage = waitFor(a, 'message:new')
    a.emit('message:send', { roomId: 'sala-5', text: 'adiós pronto' })
    const { id: messageId } = await newMessage

    const revealedB = waitFor(b, 'message:revealed')
    const destroyedA = waitFor(a, 'message:destroyed')
    const destroyedB = waitFor(b, 'message:destroyed')
    b.emit('message:reveal', { roomId: 'sala-5', messageId })

    const revealed = await revealedB
    expect(revealed.id).toBe(messageId)
    expect(revealed.text).toBe('adiós pronto')
    expect(new Date(revealed.expiresAt).getTime()).toBeGreaterThan(Date.now())

    const [destroyedFromA, destroyedFromB] = await Promise.all([destroyedA, destroyedB])
    expect(destroyedFromA.id).toBe(messageId)
    expect(destroyedFromB.id).toBe(messageId)
    expect(chat.store.getMessage(messageId)).toBeUndefined()
  }, 8000)

  it('al desconectar un participante, el otro recibe room:info actualizado', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-6')
    await joinRoom(b, 'sala-6')

    const info = waitFor(a, 'room:info')
    b.disconnect()
    expect(await info).toEqual({ participantsCount: 1, timerSeconds: 5 })
  })

  it('un segundo reveal del mismo mensaje no emite otro message:revealed', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-7')
    await joinRoom(b, 'sala-7')

    const timerInfo = waitFor(a, 'room:info')
    a.emit('room:set_timer', { roomId: 'sala-7', seconds: 1 })
    await timerInfo

    const newMessage = waitFor(a, 'message:new')
    a.emit('message:send', { roomId: 'sala-7', text: 'una vez' })
    const { id: messageId } = await newMessage

    let revealedCount = 0
    b.onAny((event) => {
      if (event === 'message:revealed') revealedCount += 1
    })

    const firstRevealed = waitFor(b, 'message:revealed')
    b.emit('message:reveal', { roomId: 'sala-7', messageId })
    await firstRevealed

    b.emit('message:reveal', { roomId: 'sala-7', messageId })
    const destroyed = waitFor(b, 'message:destroyed')
    await destroyed

    expect(revealedCount).toBe(1)
    expect(chat.store.getMessage(messageId)).toBeUndefined()
  }, 8000)

  it('destruye el mensaje aunque el receptor se desconecte tras revelar', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-8')
    await joinRoom(b, 'sala-8')

    const timerInfo = waitFor(a, 'room:info')
    a.emit('room:set_timer', { roomId: 'sala-8', seconds: 1 })
    await timerInfo

    const newMessage = waitFor(a, 'message:new')
    a.emit('message:send', { roomId: 'sala-8', text: 'solo para el emisor' })
    const { id: messageId } = await newMessage

    const revealedB = waitFor(b, 'message:revealed')
    b.emit('message:reveal', { roomId: 'sala-8', messageId })
    await revealedB

    const destroyedA = waitFor(a, 'message:destroyed')
    b.disconnect()

    expect((await destroyedA).id).toBe(messageId)
    expect(chat.store.getMessage(messageId)).toBeUndefined()
  }, 8000)

  it('permite re-entrar a la sala tras desconectarse (refresh de pestaña)', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-9')
    await joinRoom(b, 'sala-9')

    const leaveInfo = waitFor(a, 'room:info')
    b.disconnect()
    expect((await leaveInfo).participantsCount).toBe(1)

    const b2 = await connectClient()
    const rejoinInfo = waitFor(b2, 'room:info')
    b2.emit('room:join', { roomId: 'sala-9' })
    expect((await rejoinInfo).participantsCount).toBe(2)
  })

  it('al irse todos se purga la sala y los timers pendientes', async () => {
    const a = await connectClient()
    const b = await connectClient()
    await joinRoom(a, 'sala-10')
    await joinRoom(b, 'sala-10')

    const timerInfo = waitFor(a, 'room:info')
    a.emit('room:set_timer', { roomId: 'sala-10', seconds: 1 })
    await timerInfo

    const newMessage = waitFor(a, 'message:new')
    a.emit('message:send', { roomId: 'sala-10', text: 'último' })
    const { id: messageId } = await newMessage

    const revealedB = waitFor(b, 'message:revealed')
    b.emit('message:reveal', { roomId: 'sala-10', messageId })
    await revealedB

    a.disconnect()
    b.disconnect()
    await waitMs(100)

    expect(chat.store.hasRoom('sala-10')).toBe(false)
    expect(chat.store.getMessage(messageId)).toBeUndefined()

    // El timer cancelado no debe emitir nada ni reventar tras su plazo
    await waitMs(1300)
    expect(chat.store.getMessage(messageId)).toBeUndefined()
  }, 8000)
})
