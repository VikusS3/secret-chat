import type { ChatMessage } from '../hooks/useChat'
import { useCountdown } from '../hooks/useCountdown'

interface MessageBubbleProps {
  message: ChatMessage
  onReveal: (messageId: string) => void
}

export default function MessageBubble({ message, onReveal }: MessageBubbleProps) {
  const remaining = useCountdown(message.status === 'revealed' ? message.expiresAt : undefined)

  if (message.status === 'destroyed') {
    return <div className="bubble bubble--destroyed" data-testid={`message-${message.id}`} />
  }

  if (message.status === 'revealed') {
    const seconds = Math.max(Math.ceil(remaining / 1000), 0)
    const progress =
      message.durationMs !== undefined ? Math.max(remaining / message.durationMs, 0) : 0
    return (
      <div className={`bubble bubble--revealed ${message.isOwn ? 'bubble--own' : ''}`}>
        <p className="bubble__text">{message.text}</p>
        <div className="bubble__meta">
          <div className="bubble__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
          <span className="bubble__timer">{seconds}s</span>
        </div>
      </div>
    )
  }

  if (message.isOwn && message.text !== undefined) {
    return (
      <div className="bubble bubble--own" data-testid={`message-${message.id}`}>
        <p className="bubble__text">{message.text}</p>
      </div>
    )
  }

  if (message.text !== undefined) {
    return (
      <div
        className={`bubble ${message.isOwn ? 'bubble--own' : ''}`}
        data-testid={`message-${message.id}`}
      >
        <p className="bubble__text">{message.text}</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="bubble bubble--hidden"
      data-testid={`message-${message.id}`}
      onClick={() => onReveal(message.id)}
    >
      <span className="bubble__censor" aria-hidden="true">
        ●●●●●●●●
      </span>
      <span className="bubble__hint">Toca para revelar</span>
    </button>
  )
}
