import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

export const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// En producción Express sirve el build del cliente (mismo origen, sin CORS).
// Rutas resueltas con respecto a este módulo: funciona con cwd en server/.
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url))
const indexHtml = path.join(clientDist, 'index.html')

if (process.env.NODE_ENV === 'production' && existsSync(indexHtml)) {
  app.use(express.static(clientDist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(indexHtml)
  })
}
