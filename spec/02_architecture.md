# 02. Architecture

## 1. Stack Tecnológico Seleccionado
Dado el enfoque de chat en tiempo real y rápido desarrollo, el stack será:
- **Frontend:** React (usando Vite) para una UI interactiva y reactiva.
- **Empaquetado Móvil:** Capacitor (o tecnología similar) para convertir la aplicación web en un archivo `.apk` instalable para Android.
- **Backend:** Node.js con Express y Socket.IO para la gestión de WebSockets y eventos en tiempo real.
- **Almacenamiento (Temporal):** En memoria (Estructuras de datos en Node.js) para gestionar las salas y los mensajes temporalmente antes de su destrucción. No se usará base de datos persistente.

## 2. Diagrama de Arquitectura de Alto Nivel
1. El **Cliente A** (React) se conecta al **Servidor** (Node.js/Socket.IO) mediante un WebSocket.
2. El **Cliente A** entra a una "Sala" usando el Room ID en la URL.
3. El **Cliente B** (React) abre el enlace y se une a la misma sala.
4. Cuando un cliente envía un mensaje, este viaja a través de Socket.IO hacia el servidor y se distribuye a los participantes de la sala.
5. El servidor mantiene el estado efímero del chat de forma centralizada.

## 3. Estrategia de Autodestrucción (Self-Destruct Mechanism)
1. **Frontend:** Maneja un temporizador visual (UI) para darle feedback al usuario de cuánto tiempo le queda para leer el mensaje una vez abierto.
2. **Backend:** Es la fuente de verdad y el que asegura que el mensaje sea destruido sin importar que el cliente cierre la pestaña. Cuando el receptor revela el mensaje, emite un evento `message:reveal` al backend. El backend inicia el temporizador real. Al finalizar, el backend emite un evento `message:destroy` y elimina los datos del mensaje de su memoria.
