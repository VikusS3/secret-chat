import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../hooks/useChat'
import MessageBubble from './MessageBubble'

function hiddenMessage(): ChatMessage {
  return { id: 'msg-1', senderId: 'otro-socket', status: 'hidden', isOwn: false }
}

describe('MessageBubble', () => {
  it('el mensaje oculto no muestra contenido y revela al hacer clic', () => {
    const onReveal = vi.fn()
    render(<MessageBubble message={hiddenMessage()} onReveal={onReveal} />)

    expect(screen.queryByText('hola')).toBeNull()
    expect(screen.getByText('Toca para revelar')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Toca para revelar/ }))
    expect(onReveal).toHaveBeenCalledWith('msg-1')
  })

  it('el mensaje revelado muestra el texto y el contador', () => {
    const message: ChatMessage = {
      id: 'msg-2',
      senderId: 'otro-socket',
      status: 'revealed',
      isOwn: false,
      text: 'hola secreta',
      expiresAt: Date.now() + 3000,
      durationMs: 3000,
    }
    render(<MessageBubble message={message} onReveal={vi.fn()} />)

    expect(screen.getByText('hola secreta')).toBeTruthy()
    expect(screen.getByText(/[0-9]s$/)).toBeTruthy()
  })

  it('el mensaje propio enviado se muestra en claro sin revelar', () => {
    const message: ChatMessage = {
      id: 'local-1',
      senderId: 'mi-socket',
      status: 'hidden',
      isOwn: true,
      text: 'yo lo escribí',
    }
    render(<MessageBubble message={message} onReveal={vi.fn()} />)

    expect(screen.getByText('yo lo escribí')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('el mensaje destruido renderiza la animación de colapso', () => {
    const message: ChatMessage = {
      id: 'msg-3',
      senderId: 'otro-socket',
      status: 'destroyed',
      isOwn: false,
      text: 'adiós',
    }
    const { container } = render(<MessageBubble message={message} onReveal={vi.fn()} />)

    expect(container.querySelector('.bubble--destroyed')).toBeTruthy()
    expect(screen.queryByText('adiós')).toBeNull()
  })
})
