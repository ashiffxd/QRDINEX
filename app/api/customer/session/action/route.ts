import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDeviceId } from '@/lib/auth/device'
import { cookies } from 'next/headers'
import { socketEmitter, PARTICIPANT_EVENTS } from '@/lib/socket'

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

    // Verify requestor
    const activeSession = await prisma.diningSession.findUnique({
      where: { sessionToken },
      include: { participants: true },
    })

    if (!activeSession) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    const requestor = activeSession.participants.find(
      (p) => p.deviceIdentifier === deviceId && p.status === 'APPROVED'
    )

    if (!requestor) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    // Verify target participant belongs to the same session
    const target = activeSession.participants.find((p) => p.id === participantId)
    if (!target) {
      return NextResponse.json({ success: false, message: 'Participant not found in this session' }, { status: 404 })
    }

    if (target.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Participant is not pending' }, { status: 400 })
    }

    await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    })

    try {
      const payload = {
        sessionId: activeSession.id,
        participantId,
        newStatus: (action === 'APPROVE' ? 'APPROVED' : 'REJECTED') as 'APPROVED' | 'REJECTED',
      }
      socketEmitter.emitToRestaurant(activeSession.restaurantId, PARTICIPANT_EVENTS.ACTION_RESOLVED, payload)
      socketEmitter.emitToSession(activeSession.id, PARTICIPANT_EVENTS.ACTION_RESOLVED, payload)
    } catch (err) {
      console.error('[Action API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Action API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
