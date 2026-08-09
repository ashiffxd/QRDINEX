import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDeviceId } from '@/lib/auth/device'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const deviceId = await getDeviceId()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('dining_session')?.value

    if (!deviceId || !sessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Verify requestor is approved
    const activeSession = await prisma.diningSession.findUnique({
      where: { sessionToken },
      include: {
        participants: {
          orderBy: { createdAt: 'asc' },
        },
      },
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

    // Mask device IDs for security
    const safeParticipants = activeSession.participants.map((p) => ({
      id: p.id,
      status: p.status,
      joinedAt: p.createdAt,
      isMe: p.deviceIdentifier === deviceId,
      // For UI display, maybe just show "Guest 1", "Guest 2" or mask the ID
      displayName: p.deviceIdentifier === deviceId ? 'You' : `Guest ${p.id.split('-')[0]}`,
    }))

    return NextResponse.json({ success: true, participants: safeParticipants })
  } catch (error) {
    console.error('[Participants API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
