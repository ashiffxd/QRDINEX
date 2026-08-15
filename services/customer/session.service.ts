import prisma from '@/lib/prisma'
import { validateQrToken, QRErrorType } from './qr-entry.service'
import crypto from 'crypto'
import {
  DiningSession,
  SessionStatus,
  DiningTableStatus,
  OwnerApprovalStatus,
  ParticipantRole,
} from '@prisma/client'

export type SessionErrorType = QRErrorType | 'TABLE_OCCUPIED' | 'DB_ERROR'

export interface SessionResult {
  success: boolean
  error?: SessionErrorType
  session?: DiningSession
  isNew?: boolean
  /**
   * Only set when a new session is created in APPROVAL mode.
   * The customer must wait on the waiting screen until ownerApproval = APPROVED.
   */
  requiresOwnerApproval?: boolean
}

/**
 * Creates a new Dining Session or resumes an existing one for the customer.
 *
 * Three paths:
 *  A. OPEN mode, no active session   → session created, ownerApproval=APPROVED, redirect to menu
 *  B. APPROVAL mode, no active session → session created, ownerApproval=PENDING, show waiting screen
 *  C. Active session exists          → return TABLE_OCCUPIED so the caller shows join flow
 *
 * Uses Prisma Transactions to ensure Table status and Session are atomically linked.
 */
export async function createOrResumeSession(
  qrToken: string,
  deviceId: string,
  existingSessionToken?: string
): Promise<SessionResult> {
  try {
    // 1. Validate the QR Token (now includes sessionMode)
    const qrValidation = await validateQrToken(qrToken)
    if (!qrValidation.success || !qrValidation.data) {
      return { success: false, error: qrValidation.error }
    }

    const { tableId, restaurantId, qrCodeId, sessionMode } = qrValidation.data

    // 2. Check for an active session on this table
    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: { in: [SessionStatus.OPEN, SessionStatus.PENDING, SessionStatus.BILL_REQUESTED] },
      },
    })

    if (activeSession) {
      // If the browser already has the token for this session, they are the creator or approved
      if (existingSessionToken && activeSession.sessionToken === existingSessionToken) {
        return { success: true, session: activeSession, isNew: false }
      }

      // Check if they are an APPROVED participant
      const participant = await prisma.sessionParticipant.findUnique({
        where: {
          sessionId_deviceIdentifier: {
            sessionId: activeSession.id,
            deviceIdentifier: deviceId,
          },
        },
      })

      if (participant?.status === 'APPROVED') {
        return { success: true, session: activeSession, isNew: false }
      }

      // TABLE_OCCUPIED: caller should present join flow
      return { success: false, error: 'TABLE_OCCUPIED' }
    }

    // 3. No active session — create one.
    const newSessionToken = crypto.randomBytes(32).toString('hex')
    const isApprovalMode = sessionMode === 'APPROVAL'

    // 4. Atomic transaction: create session + first participant + mark table OCCUPIED
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.diningSession.create({
        data: {
          restaurantId,
          tableId,
          qrCodeId,
          sessionToken: newSessionToken,
          // In OPEN mode sessions start as OPEN immediately.
          // In APPROVAL mode they start as PENDING until the owner approves.
          status: isApprovalMode ? SessionStatus.PENDING : SessionStatus.OPEN,
          startedAt: isApprovalMode ? undefined : new Date(),
          ownerApproval: isApprovalMode
            ? OwnerApprovalStatus.PENDING
            : OwnerApprovalStatus.APPROVED,
          participants: {
            create: {
              deviceIdentifier: deviceId,
              status: 'APPROVED', // First scanner is always the HOST and auto-approved
              role: ParticipantRole.HOST,
            },
          },
        },
      })

      // Mark table OCCUPIED in the same transaction
      await tx.diningTable.update({
        where: { id: tableId },
        data: { status: DiningTableStatus.OCCUPIED },
      })

      return newSession
    })

    return {
      success: true,
      session,
      isNew: true,
      requiresOwnerApproval: isApprovalMode,
    }
  } catch (error) {
    console.error('[SessionService] createOrResumeSession error:', error)
    return { success: false, error: 'DB_ERROR' }
  }
}

/**
 * Retrieves the currently active session from the session token.
 * Validates that the session is in a usable state and includes Restaurant/Table data.
 */
export async function getCurrentSession(sessionToken: string) {
  const session = await prisma.diningSession.findUnique({
    where: { sessionToken },
    include: {
      restaurant: true,
      table: true,
    },
  })

  if (!session) {
    return null
  }

  const validStatuses: SessionStatus[] = [
    SessionStatus.OPEN,
    SessionStatus.BILL_REQUESTED,
    SessionStatus.INVOICE_GENERATED,
    SessionStatus.COMPLETED,
    SessionStatus.CLOSED,
  ]

  if (!validStatuses.includes(session.status)) {
    return null
  }

  if (session.restaurant.status !== 'ACTIVE') {
    return null
  }

  return session
}

/**
 * Marks the session as BILL_REQUESTED.
 */
export async function requestBill(sessionId: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findUnique({ where: { id: sessionId } })

    if (!session || session.status !== SessionStatus.OPEN) {
      throw new Error('Invalid session for bill request')
    }

    const updated = await tx.diningSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.BILL_REQUESTED },
    })

    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus: session.status,
        newStatus: SessionStatus.BILL_REQUESTED,
        changedBy: 'CUSTOMER',
        remarks: 'Customer requested the bill',
      },
    })

    return updated
  })
}

/**
 * Owner closes a session from the Table Management Panel.
 * This is the ONLY way a session can be closed — not by the customer.
 */
export async function ownerCloseSession(sessionId: string, ownerUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findUnique({
      where: { id: sessionId },
      include: { table: true },
    })

    if (!session) {
      throw new Error('Session not found')
    }

    const closableStatuses: SessionStatus[] = [
      SessionStatus.PENDING,
      SessionStatus.OPEN,
      SessionStatus.BILL_REQUESTED,
      SessionStatus.INVOICE_GENERATED,
    ]

    if (!closableStatuses.includes(session.status)) {
      throw new Error(`Cannot close a session with status: ${session.status}`)
    }

    const oldStatus = session.status

    // Close the session
    const updated = await tx.diningSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        closedAt: new Date(),
      },
    })

    // Free the table
    await tx.diningTable.update({
      where: { id: session.tableId },
      data: { status: DiningTableStatus.AVAILABLE },
    })

    // Audit log
    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus,
        newStatus: SessionStatus.CLOSED,
        changedBy: ownerUserId,
        remarks: 'Owner closed session from Table Management Panel',
      },
    })

    return updated
  })
}

/**
 * Owner approves a pending session (APPROVAL mode only).
 * Sets ownerApproval → APPROVED and status → OPEN, then emits socket event.
 */
export async function ownerApproveSession(sessionId: string, ownerUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findUnique({
      where: { id: sessionId },
      include: { table: true },
    })

    if (!session) throw new Error('Session not found')
    if (session.ownerApproval !== OwnerApprovalStatus.PENDING) {
      throw new Error('Session is not in PENDING approval state')
    }

    const updated = await tx.diningSession.update({
      where: { id: sessionId },
      data: {
        ownerApproval: OwnerApprovalStatus.APPROVED,
        status: SessionStatus.OPEN,
        startedAt: new Date(),
      },
    })

    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus: session.status,
        newStatus: SessionStatus.OPEN,
        changedBy: ownerUserId,
        remarks: 'Owner approved session from Table Management Panel',
      },
    })

    return updated
  })
}

/**
 * Owner rejects a pending session request (APPROVAL mode only).
 * Frees the table and marks the session CLOSED.
 */
export async function ownerRejectSession(sessionId: string, ownerUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findUnique({
      where: { id: sessionId },
      include: { table: true },
    })

    if (!session) throw new Error('Session not found')
    if (session.ownerApproval !== OwnerApprovalStatus.PENDING) {
      throw new Error('Session is not in PENDING approval state')
    }

    const updated = await tx.diningSession.update({
      where: { id: sessionId },
      data: {
        ownerApproval: OwnerApprovalStatus.REJECTED,
        status: SessionStatus.CLOSED,
        closedAt: new Date(),
      },
    })

    await tx.diningTable.update({
      where: { id: session.tableId },
      data: { status: DiningTableStatus.AVAILABLE },
    })

    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus: session.status,
        newStatus: SessionStatus.CLOSED,
        changedBy: ownerUserId,
        remarks: 'Owner rejected session request from Table Management Panel',
      },
    })

    return updated
  })
}
