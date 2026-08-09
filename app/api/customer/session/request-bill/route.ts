import { NextRequest, NextResponse } from 'next/server'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import { requestBill } from '@/services/customer/session.service'
import prisma from '@/lib/prisma'
import { socketEmitter, SESSION_EVENTS } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const updatedSession = await requestBill(customer.sessionId)

    try {
      const sessionInfo = await prisma.diningSession.findUnique({
        where: { id: updatedSession.id },
        select: { table: { select: { tableNumber: true } } },
      })
      if (sessionInfo) {
        const payload = {
          sessionId: updatedSession.id,
          shortId: updatedSession.id.split('-')[0].toUpperCase(),
          tableNumber: sessionInfo.table.tableNumber,
        }
        socketEmitter.emitToRestaurant(updatedSession.restaurantId, SESSION_EVENTS.BILL_REQUESTED, payload)
        socketEmitter.emitToSession(updatedSession.id, SESSION_EVENTS.BILL_REQUESTED, payload)
      }
    } catch (err) {
      console.error('[Customer Request Bill API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, session: updatedSession })
  } catch (error: any) {
    console.error('[Customer Request Bill API] Error:', error)
    if (error.message.includes('Invalid session')) {
      return NextResponse.json({ success: false, message: 'Invalid session or already requested.' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
