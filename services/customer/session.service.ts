import prisma from '@/lib/prisma'
import { validateQrToken, QRErrorType } from './qr-entry.service'
import crypto from 'crypto'
import { DiningSession, SessionStatus, DiningTableStatus } from '@prisma/client'

export type SessionErrorType = QRErrorType | 'TABLE_OCCUPIED' | 'DB_ERROR'

export interface SessionResult {
  success: boolean
  error?: SessionErrorType
  session?: DiningSession
  isNew?: boolean
}

/**
 * Creates a new Dining Session or resumes an existing one for the customer.
 * Uses Prisma Transactions to ensure Table status and Session are atomically linked.
 */
export async function createOrResumeSession(
  qrToken: string,
  deviceId: string,
  existingSessionToken?: string
): Promise<SessionResult> {
  try {
    // 1. Validate the QR Token
    const qrValidation = await validateQrToken(qrToken)
    if (!qrValidation.success || !qrValidation.data) {
      return { success: false, error: qrValidation.error }
    }

    const { tableId, restaurantId, qrCodeId } = qrValidation.data

    // 2. Check for an active session on this table
    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: { in: [SessionStatus.OPEN, SessionStatus.BILL_REQUESTED] },
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
      
      // Otherwise, someone else is occupying the table.
      return { success: false, error: 'TABLE_OCCUPIED' }
    }

    // 3. No active session. Create a new one.
    const newSessionToken = crypto.randomBytes(32).toString('hex')

    // 4. Use a transaction to ensure atomic creation and status update
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.diningSession.create({
        data: {
          restaurantId,
          tableId,
          qrCodeId,
          sessionToken: newSessionToken,
          status: SessionStatus.OPEN,
          startedAt: new Date(),
          participants: {
            create: {
              deviceIdentifier: deviceId,
              status: 'APPROVED',
            },
          },
        },
      })

      // Update table to OCCUPIED
      await tx.diningTable.update({
        where: { id: tableId },
        data: { status: DiningTableStatus.OCCUPIED },
      })

      return newSession
    })

    return { success: true, session, isNew: true }
  } catch (error) {
    console.error('[SessionService] createOrResumeSession error:', error)
    return { success: false, error: 'DB_ERROR' }
  }
}

/**
 * Retrieves the currently active session from the session token.
 * Validates that the session is OPEN and includes Restaurant/Table data.
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

  // Session exists but was expired or invalid
  if (!validStatuses.includes(session.status)) {
    return null
  }

  // Restaurant must still be active
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
