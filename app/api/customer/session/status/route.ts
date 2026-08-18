import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getDeviceId } from '@/lib/auth/device'
import { SessionStatus } from '@prisma/client'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 })
    }

    const deviceId = await getDeviceId()
    if (!deviceId) {
      return NextResponse.json({ success: false, status: 'NO_DEVICE' })
    }

    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
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
      return NextResponse.json({ success: true, status: 'NO_SESSION' })
    }

    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: {
          sessionId: activeSession.id,
          deviceIdentifier: deviceId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ success: true, status: 'NOT_REQUESTED' })
    }

    if (participant.status === 'APPROVED') {
      // Ensure they have the dining_session cookie
      const cookieStore = await cookies()
      if (!cookieStore.get('dining_session')) {
        cookieStore.set({
          name: 'dining_session',
          value: activeSession.sessionToken,
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 12,
        })
      }
    }

    return NextResponse.json({ success: true, status: participant.status })
  } catch (error) {
    console.error('[SessionStatus] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('dining_session')?.value
    const deviceId = await getDeviceId()

    if (!sessionToken || !deviceId) {
      return NextResponse.json({ success: true, status: 'NO_SESSION', sessionStatus: null })
    }

    const session = await prisma.diningSession.findUnique({
      where: { sessionToken },
    })

    if (!session) {
      return NextResponse.json({ success: true, status: 'NO_SESSION', sessionStatus: null })
    }

    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: {
          sessionId: session.id,
          deviceIdentifier: deviceId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ success: true, status: 'NOT_REQUESTED', sessionStatus: session.status })
    }

    return NextResponse.json({
      success: true,
      status: participant.status,
      sessionStatus: session.status,
    })
  } catch (error) {
    console.error('[SessionStatus GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
