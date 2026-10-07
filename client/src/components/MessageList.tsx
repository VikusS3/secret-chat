import type { ChatMessage } from '../hooks/useChat'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  onReveal: (messageId: string) => void
}

export default function MessageList({ messages, onReveal }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="chat__empty">
        <p>No hay mensajes todavía.</p>
        <p className="chat__empty-hint">
          Comparte el enlace para que la otra persona se una a la conversación.
        </p>
      </div>
    )
  }

  return (
    <div className="chat__messages">
      {messages.map((message) => (
        <div key={message.id} className={`row ${message.isOwn ? 'row--own' : 'row--received'}`}>
          <MessageBubble message={message} onReveal={onReveal} />
        </div>
      ))}
    </div>
  )
}
