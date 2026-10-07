# 01. Requirements

## 1. Visión General
Secret Chat es una aplicación de mensajería en tiempo real diseñada para conversaciones privadas y efímeras. Los mensajes enviados permanecen ocultos hasta que el receptor decide leerlos. Una vez revelados, los mensajes se eliminan para siempre tras un periodo de tiempo configurable.

## 2. Requerimientos Funcionales
- **Creación de Salas:** Los usuarios pueden crear una sala de chat anónima y obtener un enlace único para compartir con otra persona.
- **Mensajería en Tiempo Real:** Comunicación bidireccional instantánea entre dos usuarios en la misma sala.
- **Mensajes Ocultos por Defecto:** Al recibir un mensaje, el contenido debe estar censurado/oculto visualmente.
- **Click to Reveal:** El receptor debe hacer clic en el mensaje oculto para poder leer el texto original.
- **Autodestrucción:** Una vez que el mensaje ha sido revelado, un temporizador iniciará su cuenta regresiva. Al finalizar el tiempo, el mensaje se eliminará visualmente de ambas pantallas y permanentemente del servidor.
- **Temporizador Configurable:** La sala debe permitir configurar el tiempo de vida de los mensajes (ej. 3, 5 o 10 segundos).
- **Versión Móvil (APK):** Los usuarios deben tener la opción de descargar la aplicación en formato APK para instalarla en dispositivos Android.

## 3. Requerimientos No Funcionales
- **Privacidad y Seguridad:** Los mensajes no deben almacenarse permanentemente en una base de datos a largo plazo; deben residir en memoria o eliminarse permanentemente una vez que expiren.
- **Simplicidad:** No se requiere registro de usuarios (Zero-knowledge/Anonymous).
- **Rendimiento:** Latencia mínima en la entrega y eliminación de mensajes gracias al uso de WebSockets.
