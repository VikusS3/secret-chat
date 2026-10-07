import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@secret-chat/shared'

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const socket: ClientSocket = io({ autoConnect: false })
