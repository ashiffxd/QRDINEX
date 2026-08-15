/**
 * POST /api/customer/session/action
 *
 * The HOST (Person A) calls this to approve or reject a join request from Person B.
 *
 * Body: { participantId: string, action: 'APPROVE' | 'REJECT' }
 *
 * Security: Validates that the caller is the HOST participant of the session.
 * Only a HOST can approve/reject join requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { approveParticipant, rejectParticipant } from '@/services/customer/join.service'
import { getDeviceId } from '@/lib/auth/device'
import { cookies } from 'next/headers'
import { socketEmitter, PARTICIPANT_EVENTS } from '@/lib/socket'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { participantId, action } = await request.json()

    if (!participantId || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
    }

    const deviceId = await getDeviceId()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('dining_session')?.value

    if (!deviceId || !sessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Resolve the session from the cookie
    const activeSession = await prisma.diningSession.findUnique({
      where: { sessionToken },
      select: { id: true, restaurantId: true },
    })

    if (!activeSession) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    // Delegate to join service (validates HOST role internally)
    const result =
      action === 'APPROVE'
        ? await approveParticipant(activeSession.id, participantId, deviceId)
        : await rejectParticipant(activeSession.id, participantId, deviceId)

    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_HOST: 403,
        PARTICIPANT_NOT_FOUND: 404,
        SESSION_NOT_FOUND: 404,
        DB_ERROR: 500,
      }
      return NextResponse.json(
        { success: false, code: result.error },
        { status: statusMap[result.error ?? 'DB_ERROR'] ?? 400 }
      )
    }

    // Emit result to the session room — Person B is listening for their participantId
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const payload = {
      sessionId: activeSession.id,
      participantId,
      newStatus: newStatus as 'APPROVED' | 'REJECTED',
    }

    socketEmitter.emitToSession(activeSession.id, PARTICIPANT_EVENTS.ACTION_RESOLVED, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Action API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
