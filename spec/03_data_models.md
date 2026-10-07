# 03. Data Models

## 1. Estructura de Datos en Memoria

Para esta versión inicial, el estado de la aplicación se almacenará exclusivamente en la memoria del servidor de Node.js.

### Modelo: Room (Sala)
Representa una sesión de chat activa entre dos personas.
```typescript
interface Room {
  id: string;                  // UUID único para la sala
  participants: string[];      // Array de Socket IDs conectados (máx 2)
  timerSeconds: number;        // Tiempo en segundos para la autodestrucción (ej. 5)
  createdAt: Date;             // Fecha de creación
}
```

### Modelo: Message (Mensaje)
Representa un mensaje individual enviado en una sala.
```typescript
interface Message {
  id: string;                  // UUID del mensaje
  roomId: string;              // ID de la sala a la que pertenece
  senderId: string;            // Socket ID del remitente
  text: string;                // Contenido original del mensaje
  status: 'hidden' | 'revealed' | 'destroyed'; // Estado actual del mensaje
  revealedAt?: Date;           // Timestamp de cuándo fue revelado por el receptor
}
```
