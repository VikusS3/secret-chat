import { act, renderHook } from '@testing-library/react'
import { ERR_ROOM_FULL } from '@secret-chat/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/socket', () => {
  const listeners = new Map<string, Set<(payload: unknown) => void>>()
  return {
    socket: {
      id: 'socket-de-test',
      connected: false,
      emit: vi.fn(),
      connect: vi.fn(function (this: { connected: boolean }) {
        this.connected = true
      }),
      disconnect: vi.fn(function (this: { connected: boolean }) {
        this.connected = false
      }),
      on(event: string, cb: (payload: unknown) => void) {
        if (!listeners.has(event)) listeners.set(event, new Set())
        listeners.get(event)?.add(cb)
      },
      off(event: string, cb: (payload: unknown) => void) {
        listeners.get(event)?.delete(cb)
      },
      __fire(event: string, payload: unknown) {
        listeners.get(event)?.forEach((cb) => cb(payload))
      },
      __reset() {
        listeners.clear()
      },
    },
  }
})

import { socket } from '../lib/socket'
import { useChat } from './useChat'

const mockSocket = socket as unknown as {
  connected: boolean
  emit: ReturnType<typeof vi.fn>
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  __fire: (event: string, payload: unknown) => void
  __reset: () => void
}

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSocket.__reset()
    mockSocket.connected = false
    mockSocket.emit.mockClear()
    mockSocket.connect.mockClear()
    mockSocket.disconnect.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('conecta y une a la sala al montar', () => {
    renderHook(() => useChat('sala-1'))
    expect(mockSocket.connect).toHaveBeenCalled()
    expect(mockSocket.emit).toHaveBeenCalledWith('room:join', { roomId: 'sala-1' })
  })

  it('reintenta el join si la sala está llena y limpia el error al entrar', () => {
    const { result } = renderHook(() => useChat('sala-2'))
    expect(mockSocket.emit).toHaveBeenCalledTimes(1)

    act(() => {
      mockSocket.__fire('room:error', { message: ERR_ROOM_FULL })
    })
    expect(result.current.error).toBe(ERR_ROOM_FULL)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(mockSocket.emit).toHaveBeenCalledTimes(2)
    expect(mockSocket.emit).toHaveBeenLastCalledWith('room:join', { roomId: 'sala-2' })

    act(() => {
      mockSocket.__fire('room:info', { participantsCount: 2, timerSeconds: 5 })
    })
    expect(result.current.error).toBeNull()
    expect(result.current.info).toEqual({ participantsCount: 2, timerSeconds: 5 })
  })

  it('no reintenta ante otros errores', () => {
    const { result } = renderHook(() => useChat('sala-3'))

    act(() => {
      mockSocket.__fire('room:error', { message: 'Datos inválidos' })
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current.error).toBe('Datos inválidos')
    expect(mockSocket.emit).toHaveBeenCalledTimes(1)
  })

  it('cancela el reintento pendiente al desmontar', () => {
    const { unmount } = renderHook(() => useChat('sala-4'))

    act(() => {
      mockSocket.__fire('room:error', { message: ERR_ROOM_FULL })
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(mockSocket.emit).toHaveBeenCalledTimes(1)
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
