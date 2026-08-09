/**
 * QRDineX — Customer Socket.IO Namespace (/customer)
 * ============================================================
 * Sets up the /customer namespace for anonymous customer clients.
 *
 * Authentication strategy:
 *  Reads two cookies from the socket handshake headers:
 *    - dining_session  (set after QR scan + session start)
 *    - qrd_device_id   (set on first browser visit, 1-year lifetime)
 *
 *  Validates the session is OPEN or BILL_REQUESTED and that the
 *  connecting device is an APPROVED SessionParticipant — the same
 *  logic as validateActiveCustomer() in lib/auth/customer-session.ts.
 *
 *  One Prisma read per connection. This is acceptable because:
 *   - Sessions are long-lived (typically 1–4 hours).
 *   - Customer connections are infrequent (one per device per visit).
 *   - No polling — each device connects once.
 *
 * Room assignment:
 *  On successful connect, the socket automatically joins:
 *    session:{sessionId}
 *  All participants of the same session share this room.
 *
 * Constraints:
 *  - Read-only Prisma access — one query at connection time.
 *  - No business logic — only connection lifecycle and room management.
 *  - No write operations anywhere in this file.
 * ============================================================
 */

import type { Server, Namespace } from 'socket.io'
import prisma from '@/lib/prisma'
import { SessionStatus } from '@prisma/client'
import { sessionRoom } from '../rooms'
import type {
  CustomerServerToClientEvents,
  CustomerClientToServerEvents,
  CustomerSocketData,
  InterServerEvents,
} from '../types'

// ============================================================
// INTERNAL — COOKIE PARSER
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

export function setupCustomerNamespace(io: Server): void {
  const customerNsp: Namespace<
    CustomerClientToServerEvents,
    CustomerServerToClientEvents,
    InterServerEvents,
    CustomerSocketData
  > = io.of('/customer')

  // ----------------------------------------------------------
  // AUTHENTICATION MIDDLEWARE
  // ----------------------------------------------------------
  customerNsp.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? ''

      if (!cookieHeader) {
        return next(new Error('UNAUTHORIZED: No cookies present'))
      }

      const sessionToken = parseCookieValue(cookieHeader, 'dining_session')
      const deviceId = parseCookieValue(cookieHeader, 'qrd_device_id')

      if (!sessionToken || !deviceId) {
        return next(
          new Error('UNAUTHORIZED: dining_session or qrd_device_id cookie missing'),
        )
      }

      // Validate session + participant — mirrors validateActiveCustomer()
      // but runs in a Node.js (non-Edge) context where Prisma is available.
      const session = await prisma.diningSession.findUnique({
        where: { sessionToken },
        include: {
          participants: {
            where: { deviceIdentifier: deviceId },
          },
        },
      })

      const allowedStatuses: SessionStatus[] = [
        SessionStatus.OPEN,
        SessionStatus.BILL_REQUESTED,
        SessionStatus.INVOICE_GENERATED,
        SessionStatus.COMPLETED,
        SessionStatus.CLOSED,
      ]

      // Session must exist and be in a valid customer state
      if (!session || !allowedStatuses.includes(session.status)) {
        return next(new Error('UNAUTHORIZED: No active dining session'))
      }

      // This device must be an approved participant
      const participant = session.participants[0]
      if (!participant || participant.status !== 'APPROVED') {
        return next(new Error('UNAUTHORIZED: Device not approved for this session'))
      }

      // Attach session identity to socket.data
      socket.data = {
        sessionId: session.id,
        restaurantId: session.restaurantId,
        deviceId,
      }

      return next()
    } catch (error) {
      console.error('[CustomerNamespace] Auth middleware error:', error)
      return next(new Error('INTERNAL: Authentication failed'))
    }
  })

  // ----------------------------------------------------------
  // CONNECTION HANDLER
  // ----------------------------------------------------------
  customerNsp.on('connection', (socket) => {
    const { sessionId, restaurantId, deviceId } = socket.data

    // Join the session-scoped room.
    // All approved participants of the same session share this room.
    const room = sessionRoom(sessionId)
    void socket.join(room)

    console.log(
      `[CustomerNamespace] + Connected  | deviceId=${deviceId} sessionId=${sessionId} restaurantId=${restaurantId} room="${room}"`,
    )

    socket.on('disconnect', (reason) => {
      console.log(
        `[CustomerNamespace] - Disconnected | deviceId=${deviceId} sessionId=${sessionId} reason="${reason}"`,
      )
    })

    socket.on('error', (error) => {
      console.error(
        `[CustomerNamespace] Socket error | deviceId=${deviceId} sessionId=${sessionId}:`,
        error,
      )
    })
  })

  console.log('[Socket.IO] Customer namespace ready → /customer')
}
