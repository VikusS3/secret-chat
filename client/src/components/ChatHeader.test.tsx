import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatHeader from './ChatHeader'

const baseProps = {
  roomId: 'abc123def456',
  info: null,
  connected: true,
  onSetTimer: vi.fn(),
}

describe('ChatHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra "Esperando al otro participante..." con un solo participante', () => {
    render(<ChatHeader {...baseProps} />)
    expect(screen.getByText('Esperando al otro participante...')).toBeTruthy()
  })

  it('muestra "Chat Listo" con dos participantes', () => {
    render(<ChatHeader {...baseProps} info={{ participantsCount: 2, timerSeconds: 5 }} />)
    expect(screen.getByText('Chat Listo')).toBeTruthy()
  })

  it('muestra "Conectando..." sin conexión', () => {
    render(<ChatHeader {...baseProps} connected={false} />)
    expect(screen.getByText('Conectando...')).toBeTruthy()
  })

  it('emite onSetTimer al cambiar el select', () => {
    const onSetTimer = vi.fn()
    render(<ChatHeader {...baseProps} onSetTimer={onSetTimer} />)
    fireEvent.change(screen.getByLabelText('Tiempo de autodestrucción'), {
      target: { value: '10' },
    })
    expect(onSetTimer).toHaveBeenCalledWith(10)
  })

  it('copia el enlace de la sala al pulsar el botón', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<ChatHeader {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(writeText.mock.calls[0][0]).toContain('/chat/abc123def456')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '¡Enlace copiado!' })).toBeTruthy()
    })
  })
})
