import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getOrSetDeviceId } from '@/lib/auth/device'
import { SessionStatus } from '@prisma/client'
import { socketEmitter, PARTICIPANT_EVENTS } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 })
    }

    const deviceId = await getOrSetDeviceId()

    // Find the QR code and active session
    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
      include: {
        table: true,
      },
    })

    if (!qrCode || !qrCode.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid QR' }, { status: 400 })
    }

    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId: qrCode.tableId,
        status: SessionStatus.OPEN,
      },
    })

    if (!activeSession) {
      return NextResponse.json({ success: false, message: 'No active session found on this table' }, { status: 400 })
    }

    // Upsert the participant request
    const participant = await prisma.sessionParticipant.upsert({
      where: {
        sessionId_deviceIdentifier: {
          sessionId: activeSession.id,
          deviceIdentifier: deviceId,
        },
      },
      update: {
        // If they were rejected before, we can allow them to request again.
        status: 'PENDING',
      },
      create: {
        sessionId: activeSession.id,
        deviceIdentifier: deviceId,
        status: 'PENDING',
      },
    })

    try {
      const payload = {
        sessionId: activeSession.id,
        participantId: participant.id,
        tableNumber: qrCode.table.tableNumber,
      }
      socketEmitter.emitToRestaurant(activeSession.restaurantId, PARTICIPANT_EVENTS.JOIN_REQUEST, payload)
      socketEmitter.emitToSession(activeSession.id, PARTICIPANT_EVENTS.JOIN_REQUEST, payload)
    } catch (err) {
      console.error('[RequestJoin] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, status: participant.status })
  } catch (error) {
    console.error('[RequestJoin] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
