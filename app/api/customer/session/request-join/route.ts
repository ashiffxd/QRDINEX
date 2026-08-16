/**
 * POST /api/customer/session/request-join
 *
 * Person B calls this after scanning a QR with an active session.
 * Creates a PENDING GUEST participant record and notifies the HOST via Socket.io.
 *
 * Body: { token: string, displayName: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getOrSetDeviceId } from '@/lib/auth/device'
import { SessionStatus, ParticipantRole } from '@prisma/client'
import { socketEmitter, PARTICIPANT_EVENTS } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, displayName } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 })
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Display name is required to join a table.' },
        { status: 400 }
      )
    }

    const sanitizedName = displayName.trim().slice(0, 40)
    const deviceId = await getOrSetDeviceId()

    // Find the QR code and active session
    const qrCode = await prisma.qrCode.findUnique({
      where: { token },
      include: { table: true },
    })

    if (!qrCode || !qrCode.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid QR' }, { status: 400 })
    }

    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId: qrCode.tableId,
        status: { in: [SessionStatus.OPEN, SessionStatus.PENDING] },
      },
    })

    if (!activeSession) {
      return NextResponse.json(
        { success: false, message: 'No active session found on this table' },
        { status: 400 }
      )
    }

    // 1. Get all online device IDs in this session
    let onlineDeviceIds: string[] = []
    const ioInstance = globalThis.__io
    if (ioInstance) {
      try {
        const roomName = `session:${activeSession.id}`
        const sockets = await ioInstance.of('/customer').in(roomName).fetchSockets()
        onlineDeviceIds = sockets.map((s) => s.data.deviceId).filter(Boolean) as string[]
      } catch (err) {
        console.error('[RequestJoin] Error fetching sockets:', err)
      }
    }

    // 2. Auto-promote oldest guest to host if the current host is offline
    const { autoPromoteOldestGuest } = await import('@/services/customer/join.service')
    await autoPromoteOldestGuest(activeSession.id, onlineDeviceIds)

    // 3. Upsert the participant request
    const participant = await prisma.sessionParticipant.upsert({
      where: {
        sessionId_deviceIdentifier: {
          sessionId: activeSession.id,
          deviceIdentifier: deviceId,
        },
      },
      update: {
        status: 'PENDING',
        role: ParticipantRole.GUEST,
        displayName: sanitizedName,
      },
      create: {
        sessionId: activeSession.id,
        deviceIdentifier: deviceId,
        status: 'PENDING',
        role: ParticipantRole.GUEST,
        displayName: sanitizedName,
      },
    })

    // Set the session cookie so the guest's browser has the token for socket auth.
    // They are blocked from viewing the menu by the status check, but need the socket connection to hear the approval.
    const cookieStore = await cookies()
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const isLocal =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    const secure = process.env.NODE_ENV === 'production' && !isLocal

    cookieStore.set({
      name: 'dining_session',
      value: activeSession.sessionToken,
      httpOnly: true,
      path: '/',
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
    })

    // Emit join request to the session room — the HOST is listening there
    const payload = {
      sessionId: activeSession.id,
      participantId: participant.id,
      tableNumber: qrCode.table.tableNumber,
      displayName: sanitizedName,
    }

    socketEmitter.emitToSession(activeSession.id, PARTICIPANT_EVENTS.JOIN_REQUEST, payload)

    // Also notify the owner dashboard (so they can see join activity)
    socketEmitter.emitToRestaurant(activeSession.restaurantId, PARTICIPANT_EVENTS.JOIN_REQUEST, payload)

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      status: participant.status,
    })
  } catch (error) {
    console.error('[RequestJoin] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
