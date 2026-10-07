import { useState, type FormEvent } from 'react'

interface MessageComposerProps {
  onSend: (text: string) => void
}

export default function MessageComposer({ onSend }: MessageComposerProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (text.trim() === '') return
    onSend(text)
    setText('')
  }

  return (
    <form className="chat__composer" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Escribe un mensaje secreto..."
        maxLength={1000}
        aria-label="Mensaje"
      />
      <button type="submit" className="btn btn--primary" disabled={text.trim() === ''}>
        Enviar
      </button>
    </form>
  )
}
