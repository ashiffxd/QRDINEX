import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { completeSession } from '@/services/owner/session.service'
import prisma from '@/lib/prisma'
import { socketEmitter, SESSION_EVENTS } from '@/lib/socket'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Await params required in Next.js 15
    const resolvedParams = await params
    const { sessionId } = resolvedParams

    const body = await request.json()
    const { action } = body

    if (action !== 'COMPLETE') {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 })
    }

    const updatedSession = await completeSession(
      session.data.restaurantId,
      sessionId,
      session.data.id // The owner's user ID acts as "changedBy"
    )

    try {
      const sessionInfo = await prisma.diningSession.findUnique({
        where: { id: sessionId },
        select: { table: { select: { tableNumber: true } } },
      })
      if (sessionInfo) {
        const payload = {
          sessionId: updatedSession.id,
          shortId: updatedSession.id.split('-')[0].toUpperCase(),
          tableNumber: sessionInfo.table.tableNumber,
        }
        socketEmitter.emitToRestaurant(session.data.restaurantId, SESSION_EVENTS.CLOSED, payload)
        socketEmitter.emitToSession(updatedSession.id, SESSION_EVENTS.CLOSED, payload)
      }
    } catch (err) {
      console.error('[Owner Session Status API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, session: updatedSession })
  } catch (error: any) {
    console.error('[Owner Session Status API] Error:', error)
    
    if (error.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Session not found.' }, { status: 404 })
    }
    
    if (error.message === 'SESSION_ALREADY_COMPLETED') {
      return NextResponse.json({ success: false, message: 'Session is already completed.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
