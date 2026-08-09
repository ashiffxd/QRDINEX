/**
 * QRDineX — Custom Node.js Server Entry Point
 * ============================================================
 * Replaces `next dev` / `next start` as the application entry point.
 *
 * Responsibilities:
 *  1. Prepare the Next.js application (compiles routes, sets up HMR in dev).
 *  2. Create a Node.js HTTP server that delegates all HTTP traffic to Next.js.
 *  3. Create the Socket.IO server and attach it to the HTTP server.
 *  4. Store the Socket.IO instance on globalThis.__io so that route handlers
 *     can emit events via lib/socket/emitter.ts without circular imports.
 *  5. Start listening on the configured port.
 *
 * Deployment target: Render (Node.js Web Service)
 *
 * Package.json scripts:
 *   dev:   tsx server.ts              (development — Next.js HMR enabled)
 *   start: tsx server.ts              (production — NODE_ENV=production set by Render)
 *
 * Scalability:
 *  To scale Socket.IO across multiple Render instances, add a Redis adapter
 *  inside lib/socket/server.ts (createSocketServer). Only that file changes.
 * ============================================================
 */

import { createServer } from 'http'
import next from 'next'
import { createSocketServer } from './lib/socket/server'
import type { Server } from 'socket.io'

// ============================================================
// ENVIRONMENT
// ============================================================

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)
const hostname = process.env.HOSTNAME ?? '0.0.0.0'

// ============================================================
// GLOBAL TYPE DECLARATION
// Mirrors lib/prisma.ts pattern (globalThis.__prisma).
// Allows lib/socket/emitter.ts to access io without circular imports.
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __io: Server | undefined
}

// ============================================================
// SERVER STARTUP
// ============================================================

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    // ----------------------------------------------------------
    // HTTP SERVER
    // All HTTP traffic (pages, API routes, static files) is handled
    // by the Next.js request handler. Socket.IO intercepts WebSocket
    // upgrade requests before they reach Next.js.
    // ----------------------------------------------------------
    const httpServer = createServer((req, res) => {
      handle(req, res)
    })

    // ----------------------------------------------------------
    // SOCKET.IO
    // Creates the configured io server (CORS, transports, namespaces)
    // and attaches it to the same HTTP server on the same port.
    // ----------------------------------------------------------
    const io = createSocketServer(httpServer)

    // Store on globalThis so lib/socket/emitter.ts can access it
    // from any route handler without a direct import dependency.
    globalThis.__io = io

    // ----------------------------------------------------------
    // LISTEN
    // ----------------------------------------------------------
    httpServer.listen(port, () => {
      console.log('')
      console.log(`  ▸ QRDineX server ready`)
      console.log(`  ▸ URL:         http://${hostname}:${port}`)
      console.log(`  ▸ Environment: ${dev ? 'development' : 'production'}`)
      console.log(`  ▸ Socket.IO:   /socket.io (namespaces: /owner, /customer)`)
      console.log('')
    })
  })
  .catch((err: Error) => {
    console.error('[server.ts] Fatal startup error:', err)
    process.exit(1)
  })
