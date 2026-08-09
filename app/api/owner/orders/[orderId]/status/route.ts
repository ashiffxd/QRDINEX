import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { updateOrderStatus } from '@/services/owner/order-status.service'
import { OrderAction } from '@prisma/client'
import prisma from '@/lib/prisma'
import { socketEmitter, ORDER_EVENTS } from '@/lib/socket'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireRole(['OWNER'])
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Await params required in Next.js 15
    const resolvedParams = await params
    const { orderId } = resolvedParams

    const body = await request.json()
    const { action, remarks } = body as { action: OrderAction; remarks?: string }

    if (!action) {
      return NextResponse.json({ success: false, message: 'Action is required.' }, { status: 400 })
    }

    const updatedOrder = await updateOrderStatus(
      session.data.restaurantId,
      orderId,
      action,
      session.data.id, // The owner's user ID acts as "changedBy"
      remarks
    )

    try {
      const logAndTable = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          sessionId: true,
          session: { select: { table: { select: { tableNumber: true } } } },
          statusLogs: { orderBy: { createdAt: 'desc' }, take: 1, select: { oldStatus: true } },
        },
      })
      if (logAndTable) {
        const payload = {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.id.split('-')[0].toUpperCase(),
          tableNumber: logAndTable.session.table.tableNumber,
          oldStatus: logAndTable.statusLogs[0]?.oldStatus || 'UNKNOWN',
          newStatus: updatedOrder.status,
        }
        socketEmitter.emitToRestaurant(session.data.restaurantId, ORDER_EVENTS.STATUS_UPDATED, payload)
        socketEmitter.emitToSession(logAndTable.sessionId, ORDER_EVENTS.STATUS_UPDATED, payload)
      }
    } catch (err) {
      console.error('[Owner Order Status API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error: any) {
    console.error('[Owner Order Status API] Error:', error)
    
    if (error.message === 'ORDER_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }
    
    // Provide nice error message if it's our validation error
    if (error.message.includes('Invalid action') || error.message.includes('Remarks are required')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
