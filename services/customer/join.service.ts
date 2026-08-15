/**
 * QRDineX — Join Service
 * ============================================================
 * Handles peer-to-peer table join requests.
 *
 * Flow:
 *  1. Person B scans QR on an occupied table.
 *  2. Person B enters their display name and calls sendJoinRequest().
 *  3. The HOST (Person A) receives a socket event (join:request).
 *  4. Person A calls approveParticipant() or rejectParticipant().
 *  5. Person B's browser receives the socket event and redirects to /menu.
 *
 * If the HOST disconnects, autoPromoteOldestGuest() is called to ensure
 * there is always a participant who can approve new join requests.
 * ============================================================
 */

import prisma from '@/lib/prisma'
import { ParticipantRole, ParticipantStatus } from '@prisma/client'

export type JoinErrorType =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_ACTIVE'
  | 'ALREADY_PARTICIPANT'
  | 'NOT_HOST'
  | 'PARTICIPANT_NOT_FOUND'
  | 'DB_ERROR'

export interface JoinResult {
  success: boolean
  error?: JoinErrorType
  participantId?: string
}

// ---------------------------------------------------------------------------
// sendJoinRequest
// Called by Person B after they scan a QR with an active session.
// Creates a PENDING GUEST participant record.
// ---------------------------------------------------------------------------

export async function sendJoinRequest(
  sessionId: string,
  deviceId: string,
  displayName: string
): Promise<JoinResult> {
  try {
    const session = await prisma.diningSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) return { success: false, error: 'SESSION_NOT_FOUND' }

    // Only allow joins on sessions that are actively open
    if (session.status !== 'OPEN') {
      return { success: false, error: 'SESSION_NOT_ACTIVE' }
    }

    // Check if this device is already a participant
    const existing = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: { sessionId, deviceIdentifier: deviceId },
      },
    })

    if (existing) return { success: false, error: 'ALREADY_PARTICIPANT' }

    // Create PENDING GUEST participant
    const participant = await prisma.sessionParticipant.create({
      data: {
        sessionId,
        deviceIdentifier: deviceId,
        status: ParticipantStatus.PENDING,
        role: ParticipantRole.GUEST,
        displayName: displayName.trim().slice(0, 40), // sanitise length
      },
    })

    return { success: true, participantId: participant.id }
  } catch (error) {
    console.error('[JoinService] sendJoinRequest error:', error)
    return { success: false, error: 'DB_ERROR' }
  }
}

// ---------------------------------------------------------------------------
// approveParticipant
// Called by the HOST (Person A) to accept Person B's join request.
// Validates that the caller is genuinely the HOST of the session.
// ---------------------------------------------------------------------------

export async function approveParticipant(
  sessionId: string,
  participantId: string,
  hostDeviceId: string
): Promise<JoinResult> {
  try {
    // Verify caller is the HOST
    const hostRecord = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: { sessionId, deviceIdentifier: hostDeviceId },
      },
    })

    if (!hostRecord || hostRecord.role !== ParticipantRole.HOST) {
      return { success: false, error: 'NOT_HOST' }
    }

    const target = await prisma.sessionParticipant.findUnique({
      where: { id: participantId },
    })

    if (!target || target.sessionId !== sessionId) {
      return { success: false, error: 'PARTICIPANT_NOT_FOUND' }
    }

    await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { status: ParticipantStatus.APPROVED },
    })

    return { success: true, participantId }
  } catch (error) {
    console.error('[JoinService] approveParticipant error:', error)
    return { success: false, error: 'DB_ERROR' }
  }
}

// ---------------------------------------------------------------------------
// rejectParticipant
// Called by the HOST (Person A) to decline Person B's join request.
// ---------------------------------------------------------------------------

export async function rejectParticipant(
  sessionId: string,
  participantId: string,
  hostDeviceId: string
): Promise<JoinResult> {
  try {
    // Verify caller is the HOST
    const hostRecord = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: { sessionId, deviceIdentifier: hostDeviceId },
      },
    })

    if (!hostRecord || hostRecord.role !== ParticipantRole.HOST) {
      return { success: false, error: 'NOT_HOST' }
    }

    const target = await prisma.sessionParticipant.findUnique({
      where: { id: participantId },
    })

    if (!target || target.sessionId !== sessionId) {
      return { success: false, error: 'PARTICIPANT_NOT_FOUND' }
    }

    await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { status: ParticipantStatus.REJECTED },
    })

    return { success: true, participantId }
  } catch (error) {
    console.error('[JoinService] rejectParticipant error:', error)
    return { success: false, error: 'DB_ERROR' }
  }
}

// ---------------------------------------------------------------------------
// autoPromoteOldestGuest
// Called when the HOST disconnects (detected via Socket.io disconnect event).
// Promotes the oldest APPROVED GUEST to HOST so join requests can still be
// approved even if the original scanner has left.
// ---------------------------------------------------------------------------

export async function autoPromoteOldestGuest(
  sessionId: string,
  onlineDeviceIds: string[]
): Promise<void> {
  try {
    // 1. Find the current HOST
    const currentHost = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        role: ParticipantRole.HOST,
        status: ParticipantStatus.APPROVED,
      },
    })

    // If host is online, do nothing
    if (currentHost && onlineDeviceIds.includes(currentHost.deviceIdentifier)) {
      return
    }

    // 2. Host is offline or doesn't exist. Find the oldest online APPROVED GUEST
    const oldestOnlineGuest = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        role: ParticipantRole.GUEST,
        status: ParticipantStatus.APPROVED,
        deviceIdentifier: { in: onlineDeviceIds },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!oldestOnlineGuest) {
      // No online guests available to promote
      return
    }

    // 3. Swap roles in a transaction: demote current host (if any) and promote new host
    await prisma.$transaction(async (tx) => {
      if (currentHost) {
        await tx.sessionParticipant.update({
          where: { id: currentHost.id },
          data: { role: ParticipantRole.GUEST },
        })
      }

      await tx.sessionParticipant.update({
        where: { id: oldestOnlineGuest.id },
        data: { role: ParticipantRole.HOST },
      })
    })

    console.info(
      `[JoinService] Promoted online guest ${oldestOnlineGuest.displayName || oldestOnlineGuest.id} to HOST, demoted old host in session ${sessionId}`
    )
  } catch (error) {
    console.error('[JoinService] autoPromoteOldestGuest error:', error)
  }
}

// ---------------------------------------------------------------------------
// getSessionHost
// Returns the current HOST participant for a session (for socket targeting).
// ---------------------------------------------------------------------------

export async function getSessionHost(sessionId: string) {
  return await prisma.sessionParticipant.findFirst({
    where: {
      sessionId,
      role: ParticipantRole.HOST,
      status: ParticipantStatus.APPROVED,
    },
  })
}

