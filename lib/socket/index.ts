/**
 * QRDineX — Socket.IO Library Barrel Export
 * ============================================================
 * Single import point for all Socket.IO utilities.
 *
 * Usage in server-side route handlers (after DB commits):
 *   import { socketEmitter } from '@/lib/socket'
 *   import { ORDER_EVENTS, SESSION_EVENTS } from '@/lib/socket'
 *
 * Usage in client-side hooks (type imports only):
 *   import type { OwnerServerToClientEvents } from '@/lib/socket'
 *
 * NOTE: socketEmitter and createSocketServer are server-only.
 * Do not import them into Client Components or edge middleware.
 * ============================================================
 */

// ------------------------------------------------------------------
// EMITTER — use this in route handlers to emit events after DB commits
// ------------------------------------------------------------------
export { socketEmitter } from './emitter'

// ------------------------------------------------------------------
// EVENT NAME CONSTANTS — use these instead of raw strings
// ------------------------------------------------------------------
export {
  ORDER_EVENTS,
  SESSION_EVENTS,
  PARTICIPANT_EVENTS,
  CART_EVENTS,
  INVOICE_EVENTS,
} from './events'
export type { OwnerEventName, CustomerEventName } from './events'

// ------------------------------------------------------------------
// ROOM HELPERS — exported for advanced emission scenarios
// ------------------------------------------------------------------
export { restaurantRoom, sessionRoom, userRoom } from './rooms'

// ------------------------------------------------------------------
// SERVER FACTORY — used only by server.ts at root level
// ------------------------------------------------------------------
export { createSocketServer } from './server'

// ------------------------------------------------------------------
// TYPE EXPORTS — safe to import anywhere (no runtime behaviour)
// ------------------------------------------------------------------
export type {
  // Namespace event maps
  OwnerServerToClientEvents,
  OwnerClientToServerEvents,
  OwnerSocketData,
  CustomerServerToClientEvents,
  CustomerClientToServerEvents,
  CustomerSocketData,
  InterServerEvents,
  // Payload types — used in hooks for handler typing
  OrderNewPayload,
  OrderStatusUpdatedPayload,
  SessionNewPayload,
  SessionBillRequestedPayload,
  SessionClosedPayload,
  ParticipantJoinRequestPayload,
  ParticipantActionResolvedPayload,
  CartUpdatedPayload,
  InvoiceGeneratedPayload,
  InvoicePaidPayload,
} from './types'
