/**
 * QRDineX — Owner Socket.IO Namespace (/owner)
 * ============================================================
 * Sets up the /owner namespace for restaurant owner clients.
 *
 * Authentication strategy:
 *  Reads the qrdinex_auth JWT cookie from the socket handshake
 *  headers and verifies it with the existing verifyAuthToken()
 *  function — identical to how REST route handlers authenticate.
 *  No Prisma calls in the middleware (JWT is self-contained).
 *
 * Room assignment:
 *  On successful connect, the socket automatically joins:
 *    restaurant:{restaurantId}
 *  All events targeting this restaurant are routed to this room.
 *
 * Constraints:
 *  - No Prisma calls in connection/event handlers.
 *  - No business logic — only connection lifecycle and room management.
 *  - No write operations anywhere in this file.
 *  - No event listeners for client-to-server events (none defined).
 * ============================================================
 */

import type { Server, Namespace } from 'socket.io'
import { verifyAuthToken } from '@/lib/auth/jwt'
import { AUTH_COOKIE_NAME } from '@/constants/auth'
import { restaurantRoom } from '../rooms'
import type {
  OwnerServerToClientEvents,
  OwnerClientToServerEvents,
  OwnerSocketData,
  InterServerEvents,
} from '../types'

// ============================================================
// INTERNAL — COOKIE PARSER
// Parses a single named value from a raw Cookie header string.
// No external dependency required for this minimal operation.
// ============================================================

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const prefix = `${name}=`
  const found = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!found) return null
  return decodeURIComponent(found.slice(prefix.length))
}

// ============================================================
// NAMESPACE SETUP
// ============================================================

export function setupOwnerNamespace(io: Server): void {
  const ownerNsp: Namespace<
    OwnerClientToServerEvents,
    OwnerServerToClientEvents,
    InterServerEvents,
    OwnerSocketData
  > = io.of('/owner')

  // ----------------------------------------------------------
  // AUTHENTICATION MIDDLEWARE
  // Runs synchronously before every connection is accepted.
  // Calling next(new Error(...)) rejects the connection.
  // ----------------------------------------------------------
  ownerNsp.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? ''

      if (!cookieHeader) {
        return next(new Error('UNAUTHORIZED: No cookies present'))
      }

      const rawToken = parseCookieValue(cookieHeader, AUTH_COOKIE_NAME)

      if (!rawToken) {
        return next(new Error('UNAUTHORIZED: Auth cookie missing'))
      }

      // Reuse the same JWT verification as REST middleware
      const result = await verifyAuthToken(rawToken)

      if (!result.valid) {
        const code = result.reason === 'expired' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
        return next(new Error(`UNAUTHORIZED: ${code}`))
      }

      const { payload } = result

      // This namespace is exclusively for restaurant owners
      if (payload.role !== 'OWNER') {
        return next(new Error('FORBIDDEN: OWNER role required'))
      }

      if (!payload.restaurantId) {
        return next(new Error('FORBIDDEN: No restaurantId in token'))
      }

      // Attach verified identity to socket.data —
      // available in all subsequent event handlers.
      socket.data = {
        userId: payload.sub,
        restaurantId: payload.restaurantId,
        name: payload.name,
      }

      return next()
    } catch (error) {
      console.error('[OwnerNamespace] Auth middleware error:', error)
      return next(new Error('INTERNAL: Authentication failed'))
    }
  })

  // ----------------------------------------------------------
  // CONNECTION HANDLER
  // ----------------------------------------------------------
  ownerNsp.on('connection', (socket) => {
    const { userId, restaurantId, name } = socket.data

    // Join the restaurant-scoped room immediately on connect.
    // All events emitted via socketEmitter.emitToRestaurant() target this room.
    const room = restaurantRoom(restaurantId)
    void socket.join(room)

    console.log(
      `[OwnerNamespace] + Connected  | name="${name}" userId=${userId} restaurantId=${restaurantId} room="${room}"`,
    )

    socket.on('disconnect', (reason) => {
      // Socket.IO automatically leaves all rooms on disconnect.
      console.log(
        `[OwnerNamespace] - Disconnected | userId=${userId} reason="${reason}"`,
      )
    })

    socket.on('error', (error) => {
      console.error(
        `[OwnerNamespace] Socket error | userId=${userId}:`,
        error,
      )
    })
  })

  console.log('[Socket.IO] Owner namespace ready  → /owner')
}
