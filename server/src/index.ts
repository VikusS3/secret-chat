import { createServer } from 'node:http'
import { app } from './app.js'
import { createChatServer } from './socket.js'

const port = Number(process.env.PORT) || 3001

const httpServer = createServer(app)
createChatServer(httpServer)

httpServer.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`)
})
