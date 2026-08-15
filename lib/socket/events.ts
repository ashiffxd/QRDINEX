/**
 * QRDineX — Socket.IO Event Name Registry
 * ============================================================
 * Single source of truth for all socket event name constants.
 *
 * Rules enforced by convention:
 *  - Never use raw string literals for event names outside this file.
 *  - All route handlers, hooks, and namespace setup must import
 *    event names from this file.
 *  - Events are organized by domain module.
 *  - Naming convention: "module:action" (lowercase, colon-separated).
 * ============================================================
 */

// ============================================================
// ORDER EVENTS
// Direction: Server → Owner namespace room
// ============================================================

export const ORDER_EVENTS = {
  /** Customer placed a new order — notifies the owner kitchen/dashboard */
  NEW: 'order:new',

  /** Owner advanced an order through its lifecycle — notifies all owner clients */
  STATUS_UPDATED: 'order:status_updated',
} as const

// ============================================================
// SESSION EVENTS
// Direction: Server → Owner namespace room (NEW, BILL_REQUESTED)
//            Server → Customer namespace room (CLOSED, BILL_REQUESTED)
// ============================================================

export const SESSION_EVENTS = {
  /** Customer started a new dining session — notifies the owner dashboard */
  NEW: 'session:new',

  /** Customer requested the bill — notifies owner and customers in the session */
  BILL_REQUESTED: 'session:bill_requested',

  /** Owner closed the session — notifies customers in the session */
  CLOSED: 'session:closed',

  /**
   * APPROVAL mode — a customer scanned the QR and created a PENDING session.
   * Emitted to the owner's restaurant room so the Table Panel shows the request.
   */
  PENDING_APPROVAL: 'session:pending_approval',

  /**
   * APPROVAL mode — owner approved a PENDING session.
   * Emitted to the customer session room so the waiting screen unlocks.
   */
  OWNER_APPROVED: 'session:owner_approved',

  /**
   * APPROVAL mode — owner rejected a PENDING session.
   * Emitted to the customer session room.
   */
  OWNER_REJECTED: 'session:owner_rejected',
} as const

// ============================================================
// PARTICIPANT EVENTS
// Direction: Server → Owner namespace room (JOIN_REQUEST)
//            Server → Customer namespace room (ACTION_RESOLVED)
// ============================================================

export const PARTICIPANT_EVENTS = {
  /**
   * Person B sent a join request to an existing session.
   * Emitted to the customer session room so the HOST's screen shows the request.
   */
  JOIN_REQUEST: 'participant:join_request',

  /**
   * HOST approved or rejected Person B's join request.
   * Emitted to the customer session room — Person B listens for their participantId.
   */
  ACTION_RESOLVED: 'participant:action_resolved',
} as const

// ============================================================
// CART EVENTS
// Direction: Server → Customer namespace room
// ============================================================

export const CART_EVENTS = {
  /** A participant added or removed items from the shared session cart */
  UPDATED: 'cart:updated',
} as const

// ============================================================
// INVOICE EVENTS
// Direction: Server → Owner namespace room & Customer namespace room
// ============================================================

export const INVOICE_EVENTS = {
  /** Owner generated invoice for a session */
  GENERATED: 'invoice:generated',

  /** Owner confirmed payment for an invoice */
  PAID: 'invoice:paid',
} as const

// ============================================================
// UNION TYPES
// Used for exhaustive handler typing in hooks.
// ============================================================

export type OwnerEventName =
  | (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS]
  | typeof SESSION_EVENTS.NEW
  | typeof SESSION_EVENTS.BILL_REQUESTED
  | typeof SESSION_EVENTS.PENDING_APPROVAL
  | typeof PARTICIPANT_EVENTS.JOIN_REQUEST
  | (typeof INVOICE_EVENTS)[keyof typeof INVOICE_EVENTS]

export type CustomerEventName =
  | typeof PARTICIPANT_EVENTS.ACTION_RESOLVED
  | typeof PARTICIPANT_EVENTS.JOIN_REQUEST
  | typeof CART_EVENTS.UPDATED
  | typeof SESSION_EVENTS.BILL_REQUESTED
  | typeof SESSION_EVENTS.CLOSED
  | typeof SESSION_EVENTS.OWNER_APPROVED
  | typeof SESSION_EVENTS.OWNER_REJECTED
  | typeof ORDER_EVENTS.NEW
  | typeof ORDER_EVENTS.STATUS_UPDATED
  | (typeof INVOICE_EVENTS)[keyof typeof INVOICE_EVENTS]
