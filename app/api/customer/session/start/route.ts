import { NextRequest, NextResponse } from 'next/server'
import { createOrResumeSession } from '@/services/customer/session.service'
import { cookies, headers } from 'next/headers'
import { getOrSetDeviceId } from '@/lib/auth/device'
import prisma from '@/lib/prisma'
import { socketEmitter, SESSION_EVENTS } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const existingCookie = cookieStore.get('dining_session')
    const existingSessionToken = existingCookie?.value

    const deviceId = await getOrSetDeviceId()

    const result = await createOrResumeSession(token, deviceId, existingSessionToken)

    if (!result.success || !result.session) {
      const statusMap: Record<string, number> = {
        INVALID_QR: 404,
        QR_INACTIVE: 400,
        RESTAURANT_INACTIVE: 403,
        TABLE_UNAVAILABLE: 403,
        TABLE_OCCUPIED: 409,
        DB_ERROR: 500,
      }
      return NextResponse.json(
        { success: false, code: result.error, message: 'Unable to start session.' },
        { status: statusMap[result.error || 'DB_ERROR'] || 400 }
      )
    }

    // Set the session cookie — even for APPROVAL mode sessions.
    // The customer's browser needs the token so the waiting screen can subscribe
    // to the correct socket room. The middleware guards /menu until ownerApproval=APPROVED.
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
      value: result.session.sessionToken,
      httpOnly: true,
      path: '/',
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
    })

    if (result.isNew) {
      try {
        const table = await prisma.diningTable.findUnique({
          where: { id: result.session.tableId },
          select: { tableNumber: true, id: true },
        })

        if (table) {
          if (result.requiresOwnerApproval) {
            // APPROVAL mode — notify owner's Table Panel to show the pending card
            socketEmitter.emitToRestaurant(
              result.session.restaurantId,
              SESSION_EVENTS.PENDING_APPROVAL,
              {
                sessionId: result.session.id,
                tableId: table.id,
                tableNumber: table.tableNumber,
                createdAt: result.session.createdAt.toISOString(),
              }
            )
          } else {
            // OPEN mode — session is immediately active
            socketEmitter.emitToRestaurant(
              result.session.restaurantId,
              SESSION_EVENTS.NEW,
              {
                sessionId: result.session.id,
                shortId: result.session.id.split('-')[0].toUpperCase(),
                tableNumber: table.tableNumber,
                startedAt: (result.session.startedAt ?? new Date()).toISOString(),
              }
            )
          }
        }
      } catch (err) {
        console.error('[POST /api/customer/session/start] Socket emit error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      sessionId: result.session.id,
      // Tell the client whether to show the waiting screen or redirect to /menu
      requiresOwnerApproval: result.requiresOwnerApproval ?? false,
    })
  } catch (error) {
    console.error('[POST /api/customer/session/start] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
