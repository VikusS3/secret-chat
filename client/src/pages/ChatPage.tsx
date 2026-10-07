import { Link, useParams } from 'react-router-dom'
import { ERR_ROOM_FULL } from '@secret-chat/shared'
import ChatHeader from '../components/ChatHeader'
import MessageComposer from '../components/MessageComposer'
import MessageList from '../components/MessageList'
import { useChat } from '../hooks/useChat'

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { messages, info, error, connected, sendMessage, revealMessage, setTimer } = useChat(
    roomId ?? '',
  )

  if (roomId === undefined) {
    return <p>Sala no válida.</p>
  }

  if (error !== null && info === null) {
    return (
      <main className="chat chat--error">
        <div className="chat__error">
          <h1>No se pudo entrar al chat</h1>
          <p>
            {error}
            {error === ERR_ROOM_FULL ? ' Reintentando automáticamente...' : ''}
          </p>
          <Link to="/" className="btn btn--primary">
            Crear un chat nuevo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="chat">
      <ChatHeader roomId={roomId} info={info} connected={connected} onSetTimer={setTimer} />
      {error !== null && (
        <div className="chat__banner" role="status">
          {error}
        </div>
      )}
      <MessageList messages={messages} onReveal={revealMessage} />
      <MessageComposer onSend={sendMessage} />
    </div>
  )
}
