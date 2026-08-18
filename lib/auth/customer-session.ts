import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getDeviceId } from './device'
import { SessionStatus } from '@prisma/client'

export interface ValidatedCustomerSession {
  sessionId: string
  restaurantId: string
  deviceId: string
}

/**
 * Validates that the current request comes from an APPROVED participant
 * of an active/open Dining Session.
 * 
 * Returns the session details if valid, or null if unauthorized.
 */
export async function validateActiveCustomer(
  options: { allowCompletedOrClosed?: boolean } = { allowCompletedOrClosed: false }
): Promise<ValidatedCustomerSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('dining_session')?.value
  const deviceId = await getDeviceId()

  if (!sessionToken || !deviceId) {
    return null
  }

  const session = await prisma.diningSession.findUnique({
    where: { sessionToken },
    include: {
      participants: {
        where: { deviceIdentifier: deviceId },
      },
    },
  })

  if (!session) {
    return null
  }

  const allowedStatuses: SessionStatus[] = [
    SessionStatus.PENDING,
    SessionStatus.OPEN,
    SessionStatus.BILL_REQUESTED,
    SessionStatus.INVOICE_GENERATED,
  ]

  if (options.allowCompletedOrClosed) {
    allowedStatuses.push(SessionStatus.COMPLETED, SessionStatus.CLOSED)
  }

  if (!allowedStatuses.includes(session.status)) {
    return null
  }

  const participant = session.participants[0]
  if (!participant || participant.status !== 'APPROVED') {
    return null
  }

  return {
    sessionId: session.id,
    restaurantId: session.restaurantId,
    deviceId,
  }
}
