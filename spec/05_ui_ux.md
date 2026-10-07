# 05. UI / UX Design

## 1. Flujo del Usuario
1. **Landing Page:**
   - Un botón central y visible: "Crear Chat Secreto".
   - Un botón o enlace secundario: "Descargar App (APK)" para obtener la versión de Android.
   - Al hacer clic en "Crear Chat Secreto", el sistema genera un ID aleatorio y redirige a la ruta `/chat/:roomId` (ej. `/chat/a1b2c3d4`).
2. **Pantalla de Chat:**
   - **Header:** Muestra el estado de la conexión ("Esperando al otro participante..." o "Chat Listo"), un botón para copiar el enlace y compartirlo, y un selector `select` para ajustar el temporizador (ej. 3s, 5s, 10s).
   - **Área de Mensajes:** Lista vertical donde aparecen los globos de texto (los propios a la derecha, los recibidos a la izquierda).
   - **Input:** Campo de texto en la parte inferior para escribir y un botón "Enviar".

## 2. Estados Visuales del Mensaje

### A. Estado Oculto (Hidden)
- **Visual:** Un globo de chat que contiene el mensaje, pero difuminado con un filtro de CSS (`filter: blur(5px)`) o tapado con una textura/color sólido.
- **Interacción:** El cursor del ratón cambia a "pointer". Puede mostrarse un ícono de un "ojo cerrado" o un texto tipo "Click para revelar".

### B. Estado Revelado (Revealed)
- **Visual:** El texto se muestra de forma legible. 
- **Interacción:** Alrededor del mensaje o a un lado, debe aparecer una barra de progreso disminuyendo, o un pequeño indicador circular mostrando los segundos restantes. No se puede volver a ocultar ni se puede hacer clic nuevamente.

### C. Estado Destruido (Destroyed)
- **Visual:** Al expirar el tiempo, el mensaje desaparece de la vista con una rápida animación (Fade out / colapso de altura). 
- **DOM:** Se elimina por completo del DOM para evitar que pueda ser recuperado mediante las DevTools del navegador. 
- (Opcional) En su lugar se puede dejar un mensaje residual mínimo y opaco que diga "[Mensaje eliminado]", similar a WhatsApp, aunque removerlo por completo encaja mejor con la naturaleza de un chat secreto.
