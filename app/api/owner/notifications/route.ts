import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { SessionStatus, OrderStatus, ParticipantStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['OWNER'])
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = session.data.restaurantId

    const [pendingSessions, newOrders, pendingGuests] = await Promise.all([
      // 1. Dining sessions waiting for owner approval
      prisma.diningSession.count({
        where: {
          restaurantId,
          status: SessionStatus.PENDING,
          ownerApproval: 'PENDING',
        },
      }),
      // 2. Orders placed but not yet accepted by kitchen
      prisma.order.count({
        where: {
          restaurantId,
          status: OrderStatus.PLACED,
        },
      }),
      // 3. Guest join requests waiting for host approval (visible on live table grid)
      prisma.sessionParticipant.count({
        where: {
          session: {
            restaurantId,
            status: { in: [SessionStatus.OPEN, SessionStatus.PENDING, SessionStatus.BILL_REQUESTED] },
          },
          status: ParticipantStatus.PENDING,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      pendingSessions,
      newOrders,
      pendingGuests,
    })
  } catch (error) {
    console.error('[Owner Notifications API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
