import { useState } from 'react'
import type { RoomInfo } from '../hooks/useChat'

interface ChatHeaderProps {
  roomId: string
  info: RoomInfo | null
  connected: boolean
  onSetTimer: (seconds: number) => void
}

const TIMER_OPTIONS = [3, 5, 10]

export default function ChatHeader({ roomId, info, connected, onSetTimer }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false)

  const statusText = !connected
    ? 'Conectando...'
    : info?.participantsCount === 2
      ? 'Chat Listo'
      : 'Esperando al otro participante...'

  const currentTimer = info?.timerSeconds ?? 5

  async function handleCopy() {
    const url = `${window.location.origin}/chat/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className="chat__header">
      <div className="chat__status">
        <span
          className={`chat__dot ${connected && info?.participantsCount === 2 ? 'chat__dot--on' : ''}`}
          aria-hidden="true"
        />
        <span>{statusText}</span>
      </div>

      <div className="chat__actions">
        <label className="chat__timer">
          Autodestrucción
          <select
            value={currentTimer}
            onChange={(event) => onSetTimer(Number(event.target.value))}
            aria-label="Tiempo de autodestrucción"
          >
            {!TIMER_OPTIONS.includes(currentTimer) && (
              <option value={currentTimer}>{currentTimer}s</option>
            )}
            {TIMER_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds}s
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="btn btn--small" onClick={handleCopy}>
          {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
        </button>
      </div>
    </header>
  )
}
