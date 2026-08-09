/**
 * QRDineX — SocketEmitter
 * ============================================================
 * The single abstraction layer between route handlers and Socket.IO.
 *
 * Route handlers MUST use this singleton — never reference the
 * Socket.IO Server instance directly.
 *
 * Design contracts:
 *  - All emit methods are fire-and-forget (void return).
 *  - All errors are caught, logged, and swallowed — never re-thrown.
 *  - Socket failures CANNOT propagate to REST request/response cycles.
 *  - If Socket.IO is not yet initialized, all emits are silently skipped.
 *    This occurs safely in test environments and during cold startup.
 *
 * Scalability note:
 *  Currently uses globalThis.__io (in-process single server).
 *  When adding @socket.io/redis-adapter for horizontal scaling,
 *  only this file changes — no route handlers are affected.
 * ============================================================
 */

import type { Server } from 'socket.io'
import type {
  OwnerServerToClientEvents,
  CustomerServerToClientEvents,
} from './types'
import { restaurantRoom, sessionRoom } from './rooms'

// ============================================================
// GLOBAL DECLARATION
// Mirrors the pattern in lib/prisma.ts for globalThis.__prisma.
// Set by server.ts on startup; read here on every emit call.
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __io: Server | undefined
}

// ============================================================
// INTERNAL ACCESSOR
// ============================================================

/**
 * Returns the live Socket.IO Server instance, or null if not initialized.
 * Reads from globalThis.__io, which is set by server.ts at startup.
 */
function getIO(): Server | null {
  return globalThis.__io ?? null
}

// ============================================================
// EMITTER CLASS
// ============================================================

class SocketEmitter {
  // ----------------------------------------------------------
  // INTERNAL — GENERIC ROOM EMIT
  // ----------------------------------------------------------

  /**
   * Core emit method. Routes an event to a room on the specified namespace.
   * All public methods delegate here.
   *
   * @param namespacePath  e.g. '/owner', '/customer'
   * @param room           Room name — always derived from rooms.ts helpers
   * @param event          Event name string — always from events.ts constants
   * @param payload        JSON-serializable event payload
   */
  private emitToRoom(
    namespacePath: string,
    room: string,
    event: string,
    payload: unknown,
  ): void {
    const io = getIO()

    if (!io) {
      // Socket.IO not yet initialized — startup race condition or test env.
      // This is expected during early boot. Skip silently.
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(io.of(namespacePath).to(room) as any).emit(event, payload)
    } catch (error) {
      // Socket errors must NEVER propagate to callers.
      // Log only — the HTTP response has already been sent by this point.
      console.error(
        `[SocketEmitter] Emit failed — event: "${event}", room: "${room}", namespace: "${namespacePath}":`,
        error,
      )
    }
  }

  // ----------------------------------------------------------
  // OWNER NAMESPACE
  // ----------------------------------------------------------

  /**
   * Emits an event to all owner clients subscribed to a restaurant room.
   *
   * Call this AFTER a successful Prisma transaction in a route handler.
   * The HTTP response should already be returned before calling this.
   *
   * @param restaurantId  UUID of the restaurant.
   * @param event         A key of OwnerServerToClientEvents.
   * @param payload       Payload matching the event's parameter type.
   *
   * @example
   *   // In a route handler, after placeOrder() transaction commits:
   *   socketEmitter.emitToRestaurant(restaurantId, ORDER_EVENTS.NEW, {
   *     orderId, orderNumber, tableNumber, totalAmount, itemsCount, createdAt
   *   })
   */
  emitToRestaurant<E extends keyof OwnerServerToClientEvents>(
    restaurantId: string,
    event: E,
    payload: Parameters<OwnerServerToClientEvents[E]>[0],
  ): void {
    this.emitToRoom(
      '/owner',
      restaurantRoom(restaurantId),
      event as string,
      payload,
    )
  }

  // ----------------------------------------------------------
  // CUSTOMER NAMESPACE
  // ----------------------------------------------------------

  /**
   * Emits an event to all customer clients in a session room.
   *
   * Call this AFTER a successful Prisma transaction in a route handler.
   *
   * @param sessionId  UUID of the dining session.
   * @param event      A key of CustomerServerToClientEvents.
   * @param payload    Payload matching the event's parameter type.
   *
   * @example
   *   // In a route handler, after requestBill() transaction commits:
   *   socketEmitter.emitToSession(sessionId, SESSION_EVENTS.BILL_REQUESTED, {
   *     sessionId, shortId, tableNumber
   *   })
   */
  emitToSession<E extends keyof CustomerServerToClientEvents>(
    sessionId: string,
    event: E,
    payload: Parameters<CustomerServerToClientEvents[E]>[0],
  ): void {
    this.emitToRoom(
      '/customer',
      sessionRoom(sessionId),
      event as string,
      payload,
    )
  }

  // ----------------------------------------------------------
  // FUTURE — CROSS-NAMESPACE USER TARGETING
  // ----------------------------------------------------------

  /**
   * Emits an event directly to a user room on a given namespace.
   * Reserved for future use (e.g. admin push notifications).
   *
   * @param userId     UUID of the target user.
   * @param namespace  Namespace path.
   * @param event      Event name string.
   * @param payload    JSON-serializable payload.
   */
  emitToUser(
    _userId: string,
    _namespace: string,
    _event: string,
    _payload: unknown,
  ): void {
    // No-op placeholder — implementation deferred to future phase.
    // When implemented, this will call emitToRoom with userRoom(_userId).
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

/**
 * The singleton SocketEmitter instance.
 *
 * Import this in route handlers to emit events after DB commits:
 *
 *   import { socketEmitter } from '@/lib/socket'
 *   import { ORDER_EVENTS } from '@/lib/socket'
 *
 *   // After successful Prisma transaction:
 *   socketEmitter.emitToRestaurant(restaurantId, ORDER_EVENTS.NEW, payload)
 */
export const socketEmitter = new SocketEmitter()
