/**
 * QRDineX — Socket.IO Server Factory
 * ============================================================
 * Creates and configures the Socket.IO Server instance, then
 * attaches it to the Node.js HTTP server from server.ts.
 *
 * Scalability note:
 *  Currently uses the default in-memory adapter (single-process, single-server).
 *  To scale horizontally on Render (multiple instances) or to support Redis pub/sub,
 *  replace the adapter here — no other file changes are required:
 *
 *    import { createAdapter } from '@socket.io/redis-adapter'
 *    import { createClient } from 'redis'
 *
 *    const pubClient = createClient({ url: process.env.REDIS_URL })
 *    const subClient = pubClient.duplicate()
 *    await Promise.all([pubClient.connect(), subClient.connect()])
 *    io.adapter(createAdapter(pubClient, subClient))
 *
 * Only this file needs to change for the adapter migration.
 * ============================================================
 */

import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { setupOwnerNamespace } from './namespaces/owner'
import { setupCustomerNamespace } from './namespaces/customer'

/**
 * Creates the Socket.IO Server, configures CORS and transport,
 * registers all namespaces, and returns the configured instance.
 *
 * Called exactly once from server.ts during startup.
 *
 * @param httpServer  The Node.js HTTP server created in server.ts.
 * @returns           The configured Socket.IO Server instance.
 */
export function createSocketServer(httpServer: HTTPServer): Server {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000').replace(/\/$/, '')

  const io = new Server(httpServer, {
    // ----------------------------------------------------------
    // CORS
    // credentials: true is required so the browser sends the
    // JWT cookie (qrdinex_auth) and dining_session cookie with
    // the WebSocket upgrade handshake request.
    // ----------------------------------------------------------
    cors: {
      origin: appUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },

    // ----------------------------------------------------------
    // TRANSPORTS
    // Prefer WebSocket for performance; fall back to long-polling
    // for corporate firewalls or proxies that block WS upgrades.
    // ----------------------------------------------------------
    transports: ['websocket', 'polling'],

    // ----------------------------------------------------------
    // PATH
    // Default /socket.io — matches socket.io-client defaults.
    // ----------------------------------------------------------
    path: '/socket.io',

    // ----------------------------------------------------------
    // ADAPTER
    // Default: in-memory (single process).
    // To scale: replace with Redis adapter — see scalability note above.
    // ----------------------------------------------------------
  })

  // Register namespaces
  setupOwnerNamespace(io)
  setupCustomerNamespace(io)

  return io
}
