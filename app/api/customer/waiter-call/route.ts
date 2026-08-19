import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { socketEmitter } from '@/lib/socket'
import { WAITER_EVENTS } from '@/lib/socket/events'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('dining_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ success: false, message: 'No active session found.' }, { status: 401 })
  }

  try {
    const session = await prisma.diningSession.findUnique({
      where: { sessionToken },
      include: { table: true }
    })

    if (!session || session.status === 'COMPLETED' || session.status === 'CLOSED') {
      return NextResponse.json({ success: false, message: 'Invalid or inactive session.' }, { status: 400 })
    }

    const { type } = await req.json()
    if (!type || !['WATER', 'TISSUE', 'CLEANING', 'ASSISTANCE'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid request type.' }, { status: 400 })
    }

    const newCall = await prisma.waiterCall.create({
      data: {
        sessionId: session.id,
        type,
        status: 'PENDING'
      }
    })

    // Emit live WebSocket update to the owner dashboard room
    try {
      await socketEmitter.emitToRestaurant(session.restaurantId, WAITER_EVENTS.CALL, {
        id: newCall.id,
        type: newCall.type,
        status: newCall.status,
        createdAt: newCall.createdAt.toISOString(),
        tableNumber: session.table.tableNumber
      })
    } catch (socketErr) {
      console.error('[WaiterCall API] Socket emit error:', socketErr)
    }

    return NextResponse.json({ success: true, data: newCall })
  } catch (error) {
    console.error('[WaiterCall API] Error creating call:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
