/**
 * QRDineX — Database Health Check & Transaction Helper
 * ==========================================================================
 * Utility functions for:
 *   1. Health checking the database connection (used in health-check API)
 *   2. Wrapping operations in Prisma interactive transactions with
 *      consistent error handling and logging
 *
 * Usage:
 *   import { checkDbHealth, withTransaction } from '@/lib/db-utils'
 * ==========================================================================
 */

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { parsePrismaError, type ParsedDbError } from '@/lib/db-error'

// ---------------------------------------------------------------------------
// DATABASE HEALTH CHECK
// ---------------------------------------------------------------------------

export interface DbHealthResult {
  healthy: boolean
  latencyMs: number | null
  error?: string
}

/**
 * Performs a lightweight database ping to verify connectivity.
 * Suitable for use in a /api/health Route Handler.
 *
 * Returns the round-trip latency in milliseconds if healthy,
 * or an error string if the connection fails.
 */
export async function checkDbHealth(): Promise<DbHealthResult> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      healthy: true,
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    const parsed = parsePrismaError(error)
    return {
      healthy: false,
      latencyMs: null,
      error: parsed.message,
    }
  }
}

// ---------------------------------------------------------------------------
// TRANSACTION HELPER
// ---------------------------------------------------------------------------

/**
 * Result type for all transaction-wrapped operations.
 * Callers always receive either data or an error — never an unhandled throw.
 */
export type TransactionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ParsedDbError }

/**
 * Wraps an operation in a Prisma interactive transaction.
 *
 * Benefits:
 *  - Automatic rollback on any error thrown inside the callback
 *  - Consistent error parsing via parsePrismaError
 *  - Server-side error logging without leaking to the client
 *  - Timeout protection (default 10 seconds for complex operations)
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const session = await tx.diningSession.create({ ... })
 *     await tx.diningTable.update({ where: { id: tableId }, data: { status: 'OCCUPIED' } })
 *     return session
 *   })
 *
 *   if (!result.success) {
 *     // result.error is a ParsedDbError — use dbErrorToHttpStatus(result.error)
 *   }
 *
 * @param operation  Async callback receiving a Prisma transaction client
 * @param timeoutMs  Max duration in ms before the transaction is rolled back (default: 10000)
 */
export async function withTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  timeoutMs: number = 10_000,
): Promise<TransactionResult<T>> {
  try {
    const data = await prisma.$transaction(operation, {
      maxWait: 5_000,   // Max time to wait for a transaction slot (ms)
      timeout: timeoutMs, // Max time the transaction may run before rollback (ms)
    })
    return { success: true, data }
  } catch (error) {
    const parsed = parsePrismaError(error)

    // Log full error on the server — never expose originalError to the client
    console.error('[withTransaction] Transaction failed:', {
      code: parsed.code,
      message: parsed.message,
      field: parsed.field,
      originalError: parsed.originalError,
    })

    return { success: false, error: parsed }
  }
}

// ---------------------------------------------------------------------------
// TRANSACTION USE-CASE REGISTRY
// ---------------------------------------------------------------------------
// The following operations MUST use withTransaction in their implementations.
// This serves as the authoritative reference for Phase 3 backend development.
//
// 1. RESTAURANT SIGNUP
//    - prisma.user.create(ownerData)
//    - prisma.restaurant.create(restaurantData)
//    - prisma.restaurantVerification.create(verificationData)
//    Reason: All three records must be created atomically. A partial creation
//    (e.g. user created but restaurant fails) leaves orphaned data.
//
// 2. RESTAURANT APPROVAL
//    - prisma.restaurant.update({ status: ACTIVE })
//    - prisma.restaurantVerification.update({ approvalStatus: VERIFIED })
//    - prisma.restaurantStatusLog.create(logEntry)
//    Reason: Status, verification record, and audit log must all update
//    together. A partial update produces an inconsistent audit trail.
//
// 3. QR CODE REGENERATION
//    - prisma.qrCode.updateMany({ where: { tableId, isActive: true }, data: { isActive: false } })
//    - prisma.qrCode.create({ tableId, token, isActive: true })
//    Reason: Deactivating old QRs and creating the new one must be atomic.
//    A race condition between two regeneration requests could result in two
//    active QR codes for the same table.
//
// 4. SESSION CREATION (customer scans QR)
//    - Validate QrCode.token is active
//    - Check no OPEN DiningSession exists for the table (partial index enforces)
//    - prisma.diningSession.create({ status: PENDING })
//    - prisma.diningTable.update({ status: OCCUPIED })
//    Reason: Table status and session creation must be atomic. Without a
//    transaction, two near-simultaneous QR scans could create two sessions.
//
// 5. ORDER PLACEMENT
//    - prisma.order.create(orderData)
//    - prisma.orderItem.createMany(itemsData)  // priceAtPurchase snapshot
//    - prisma.diningSession.update({ status: OPEN, startedAt: now() })  // PENDING→OPEN
//    Reason: Order and its line items must be atomic. If item creation fails,
//    the order header must not remain in the database in a partial state.
//
// 6. SESSION CLOSE / BILLING
//    - prisma.diningSession.update({ status: CLOSED, closedAt: now() })
//    - prisma.diningTable.update({ status: AVAILABLE })
//    Reason: Session close and table availability restoration must be atomic.
//    A failed table update would leave the table stuck as OCCUPIED.
// ---------------------------------------------------------------------------
