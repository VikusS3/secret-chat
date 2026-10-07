import { useNavigate } from 'react-router-dom'
import { generateRoomId } from '../lib/id'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="landing">
      <h1 className="landing__title">
        Secret<span>Chat</span>
      </h1>
      <p className="landing__tagline">Mensajes que se leen una vez y desaparecen para siempre.</p>
      <div className="landing__actions">
        <button
          type="button"
          className="btn btn--primary btn--big"
          onClick={() => navigate(`/chat/${generateRoomId()}`)}
        >
          Crear Chat Secreto
        </button>
        <button type="button" className="btn btn--ghost btn--big" disabled>
          Descargar App (APK)
        </button>
      </div>
    </main>
  )
}
