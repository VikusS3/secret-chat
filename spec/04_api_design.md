# 04. API & WebSocket Design

## 1. REST API Endpoints (Express)
Dado que la comunicación se basa en WebSockets, los endpoints HTTP serán mínimos:
- `GET /api/health` - Verifica el estado del servidor.
- `GET /api/ping` - Devuelve `true`. Endpoint barato para keep-alive periódico (evita que el host en plan gratuito se duerma).

## 2. Eventos de Socket.IO

### Eventos del Cliente hacia el Servidor (Client -> Server)
- `room:join { roomId: string }`
  - Úne al cliente a una sala. El servidor evalúa si la sala ya tiene 2 personas y permite o deniega la entrada.
- `room:set_timer { roomId: string, seconds: number }`
  - Actualiza el temporizador de autodestrucción global de la sala.
- `message:send { roomId: string, text: string }`
  - Envía un nuevo mensaje a la sala.
- `message:reveal { roomId: string, messageId: string }`
  - El receptor avisa que ha hecho clic en el mensaje y solicita revelar el contenido.

### Eventos del Servidor hacia el Cliente (Server -> Client)
- `room:info { participantsCount: number, timerSeconds: number }`
  - Notifica a la sala su estado actual (ej: alguien se conectó/desconectó o cambió el timer).
- `room:error { message: string }`
  - Para notificar errores, por ejemplo, "La sala está llena".
- `message:new { id: string, senderId: string, status: 'hidden' }`
  - Notifica a la sala que ha llegado un nuevo mensaje. Por seguridad el servidor nunca envía el texto: el emisor lo conserva en local hasta que se ejecute `message:reveal`.
- `message:revealed { id: string, text?: string, expiresAt: string }`
  - Se emite a toda la sala con el texto en claro y con `expiresAt` en formato ISO 8601, para que ambos clientes inicien la cuenta regresiva.
- `message:destroyed { id: string }`
  - Notifica a todos los clientes en la sala que el temporizador ha finalizado y el mensaje debe desaparecer de la UI inmediatamente.
