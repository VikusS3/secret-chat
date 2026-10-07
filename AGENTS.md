# AGENTS.md

## Fuente de verdad

Todo diseño vive en `spec/`, en este orden:

- `01_requirements.md` — funcionalidad, requisitos no funcionales
- `02_architecture.md` — stack y mecanismo de autodestrucción
- `03_data_models.md` — interfaces TypeScript (`Room`, `Message`)
- `04_api_design.md` — REST mínimo + eventos Socket.IO
- `05_ui_ux.md` — flujo, estados del mensaje, detalles visuales

Si docs y código divergen, el spec manda hasta que se actualice el spec. Mantén los specs al día al cambiar comportamiento.

## Comandos

```bash
npm run dev          # shared (tsc -w) + server (tsx watch) + vite, en paralelo
npm run typecheck    # tsc en server y client
npm run lint         # oxlint (config en .oxlintrc.json de la raíz)
npm test             # vitest en server y client
npm run build        # shared -> server -> client, en ese orden
npm run format       # prettier --write
npm start            # producción: server en :3001 sirviendo API + client/dist
```

Orden de verificación antes de dar por terminado un cambio: **`typecheck -> lint -> test`**. `format` si tocaste estilo.

## Estructura (monorepo npm workspaces)

- `shared/` — tipos compartidos (`Room`, `Message`), tipos de eventos Socket.IO y constantes de error (`ERR_ROOM_FULL`...). Se compila a `dist/` y el resto importa `@secret-chat/shared` **desde dist, nunca desde src**. Los scripts raíz (`predev`/`pretest`/`pretypecheck`) lo compilan primero; si ejecutas `tsc`/`vitest` a mano dentro de un workspace, asegúrate de que `shared/dist` exista.
- `server/` — Express 5 + Socket.IO. `src/` compilado con `tsc` (`tsconfig.build.json`), tests en `test/` (vitest, imports explícitos, sin globals). Puerto `3001` (o `PORT`). `npm run start` ejecuta `dist/index.js`.
- `client/` — Vite 8 + React 19 + React Router. Socket singleton en `src/lib/socket.ts`, toda la lógica de sala/mensajes en `src/hooks/useChat.ts`. En dev, Vite hace proxy de `/api` y `/socket.io` (ws) a :3001. Tests jsdom: el cleanup de Testing Library vive en `vitest.setup.ts` (no activar `globals`; sin cleanup los renders se acumulan entre tests).

## Convenciones de código (no son opcionales)

- **ESM en todos lados.** En `server/` y `shared/` (moduleResolution `nodenext`): los imports relativos llevan extensión `.js` aunque el archivo fuente sea `.ts` (`import { app } from './app.js'`).
- **Sin enums ni parameter properties** (`erasableSyntaxOnly`): usa `type` unions, como `MessageStatus`.
- **Sin punto y coma** — Prettier manda (`semi: false`, comillas simples, 100 columnas).
- **No hay ESLint**: el linter es **oxlint** (config única en raíz). No añadas `eslint.config.*`.
- `spec/` está en `.prettierignore`: no reformatear los specs.
- Specs y UI en **español**; nombres de eventos/variables en inglés (`message:reveal`, `timerSeconds`).

## Decisiones ya tomadas (no re-discutir)

- Frontend: React + Vite. Backend: Node.js + Express + Socket.IO. TypeScript en todo.
- APK vía Capacitor, **al final** (Fase 5), cuando la web funcione.
- **Sin base de datos**: estado solo en memoria del servidor. No introducir persistencia.
- **Sin registro de usuarios**: anónimo, salas de 2 participantes por enlace.
- Backend es la fuente de verdad de la autodestrucción: el cliente solo pinta el temporizador; el servidor dispara `message:destroy`. El texto en claro no viaja al receptor hasta `message:reveal`.
- Deploy en la nube (Fase 4): **Render** con `render.yaml` (Blueprint). En producción (`NODE_ENV=production`) Express sirve `client/dist` con fallback SPA (mismo origen, sin CORS); el cliente usa la URL del servidor vía proxy/origen — nunca URLs absolutas a localhost.

## Pendiente (roadmap)

Fases 1-4 hechas: backend (25 tests), UI React (16 tests), edge cases, y deploy listo para Render (`render.yaml` + Express sirviendo `client/dist`, verificado con `NODE_ENV=production`). Pendiente: subir a GitHub y crear el servicio en Render (paso manual del usuario). Siguiente: Fase 5 (APK Capacitor). Prueba manual pendiente con dos pestañas reales.
