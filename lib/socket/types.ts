/**
 * QRDineX — Socket.IO Type Definitions
 * ============================================================
 * Single source of truth for all TypeScript interfaces used
 * across the real-time infrastructure.
 *
 * Shared between:
 *  - Server-side namespace setup (lib/socket/namespaces/)
 *  - Client-side hooks (hooks/useOwnerSocket, hooks/useCustomerSocket)
 *  - SocketEmitter (lib/socket/emitter.ts)
 *
 * Design rules:
 *  - Event payload types live here — never inline.
 *  - Server-to-client and client-to-server events are separate interfaces.
 *  - Per-socket data (socket.data shape) is typed per namespace.
 *  - All payload fields use JSON-serializable primitives only.
 * ============================================================
 */

// ============================================================
// ORDER EVENT PAYLOADS
// ============================================================

export interface OrderNewPayload {
  orderId: string
  /** First segment of UUID, uppercased — used as a short display ID */
  orderNumber: string
  tableNumber: number
  totalAmount: number
  itemsCount: number
  /** ISO 8601 string — safe for JSON transport */
  createdAt: string
}

export interface OrderStatusUpdatedPayload {
  orderId: string
  orderNumber: string
  tableNumber: number
  oldStatus: string
  newStatus: string
}

// ============================================================
// SESSION EVENT PAYLOADS
// ============================================================

export interface SessionNewPayload {
  sessionId: string
  /** First segment of UUID, uppercased — used as a short display ID */
  shortId: string
  tableNumber: number
  /** ISO 8601 string */
  startedAt: string
}

export interface SessionBillRequestedPayload {
  sessionId: string
  shortId: string
  tableNumber: number
}

export interface SessionClosedPayload {
  sessionId: string
  shortId: string
  tableNumber: number
}

// ============================================================
// PARTICIPANT EVENT PAYLOADS
// ============================================================

export interface ParticipantJoinRequestPayload {
  sessionId: string
  participantId: string
  tableNumber: number
  /** Display name entered by the joining guest (Option B). */
  displayName: string
}

export interface ParticipantActionResolvedPayload {
  sessionId: string
  participantId: string
  newStatus: 'APPROVED' | 'REJECTED'
}

// ============================================================
// SESSION APPROVAL PAYLOADS (APPROVAL mode)
// ============================================================

/** Emitted to the owner when a customer creates a PENDING session. */
export interface SessionPendingApprovalPayload {
  sessionId: string
  tableId: string
  tableNumber: number
  /** ISO 8601 string */
  createdAt: string
}

/** Emitted to the customer's session room when the owner approves. */
export interface SessionOwnerApprovedPayload {
  sessionId: string
  sessionToken: string
}

/** Emitted to the customer's session room when the owner rejects. */
export interface SessionOwnerRejectedPayload {
  sessionId: string
}

// ============================================================
// CART EVENT PAYLOADS
// ============================================================

export interface CartUpdatedPayload {
  sessionId: string
  totalItems: number
  subtotal: number
}

// ============================================================
// INVOICE EVENT PAYLOADS
// ============================================================

export interface InvoiceGeneratedPayload {
  invoiceId: string
  invoiceNumber: string
  sessionId: string
  tableNumber: number
  grandTotal: number
  generatedAt: string
}

export interface InvoicePaidPayload {
  invoiceId: string
  invoiceNumber: string
  sessionId: string
  tableNumber: number
  grandTotal: number
  paymentMethod: string
  paidAt: string
}

// ============================================================
// WAITER CALL EVENT PAYLOADS
// ============================================================

export interface WaiterCallPayload {
  id: string
  type: 'WATER' | 'TISSUE' | 'CLEANING' | 'ASSISTANCE' | 'BILL'
  status: string
  createdAt: string
  tableNumber: number
}

export interface WaiterCallResolvedPayload {
  id: string
}

// ============================================================
// OWNER NAMESPACE — SERVER → CLIENT EVENTS
// Events sent from the server to connected owner clients.
// ============================================================

export interface OwnerServerToClientEvents {
  'order:new': (payload: OrderNewPayload) => void
  'order:status_updated': (payload: OrderStatusUpdatedPayload) => void
  'session:new': (payload: SessionNewPayload) => void
  'session:bill_requested': (payload: SessionBillRequestedPayload) => void
  'session:closed': (payload: SessionClosedPayload) => void
  /** APPROVAL mode — new pending session requires owner action */
  'session:pending_approval': (payload: SessionPendingApprovalPayload) => void
  'participant:join_request': (payload: ParticipantJoinRequestPayload) => void
  'participant:action_resolved': (payload: ParticipantActionResolvedPayload) => void
  'invoice:generated': (payload: InvoiceGeneratedPayload) => void
  'invoice:paid': (payload: InvoicePaidPayload) => void
  'waiter:call': (payload: WaiterCallPayload) => void
  'waiter:resolved': (payload: WaiterCallResolvedPayload) => void
}

// ============================================================
// OWNER NAMESPACE — CLIENT → SERVER EVENTS
// All mutations go through REST APIs.
// This interface exists for completeness and future extensibility.
// ============================================================

export interface OwnerClientToServerEvents {
  // Empty by design — owner clients only receive events.
}

// ============================================================
// OWNER NAMESPACE — PER-SOCKET DATA
// Attached to socket.data after successful authentication.
// ============================================================

export interface OwnerSocketData {
  userId: string
  restaurantId: string
  name: string
}

// ============================================================
// CUSTOMER NAMESPACE — SERVER → CLIENT EVENTS
// Events sent from the server to connected customer clients.
// ============================================================

export interface CustomerServerToClientEvents {
  'participant:action_resolved': (payload: ParticipantActionResolvedPayload) => void
  'participant:join_request': (payload: ParticipantJoinRequestPayload) => void
  'cart:updated': (payload: CartUpdatedPayload) => void
  'session:bill_requested': (payload: SessionBillRequestedPayload) => void
  'session:closed': (payload: SessionClosedPayload) => void
  /** APPROVAL mode — owner approved this session; customer can enter menu */
  'session:owner_approved': (payload: SessionOwnerApprovedPayload) => void
  /** APPROVAL mode — owner rejected this session */
  'session:owner_rejected': (payload: SessionOwnerRejectedPayload) => void
  'order:new': (payload: OrderNewPayload) => void
  'order:status_updated': (payload: OrderStatusUpdatedPayload) => void
  'invoice:generated': (payload: InvoiceGeneratedPayload) => void
  'invoice:paid': (payload: InvoicePaidPayload) => void
}

// ============================================================
// CUSTOMER NAMESPACE — CLIENT → SERVER EVENTS
// ============================================================

export interface CustomerClientToServerEvents {
  // Empty by design — customer clients only receive events.
}

// ============================================================
// CUSTOMER NAMESPACE — PER-SOCKET DATA
// ============================================================

export interface CustomerSocketData {
  sessionId: string
  restaurantId: string
  deviceId: string
  status?: string
}

// ============================================================
// INTER-SERVER EVENTS
// Reserved for future horizontal scaling (Redis pub/sub bridge).
// ============================================================

export interface InterServerEvents {
  ping: () => void
}
