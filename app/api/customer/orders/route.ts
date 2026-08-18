import { NextRequest, NextResponse } from 'next/server'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import { placeOrder, getSessionOrders } from '@/services/customer/order.service'
import prisma from '@/lib/prisma'
import { socketEmitter, ORDER_EVENTS, CART_EVENTS } from '@/lib/socket'
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'


export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimit(`order_${ip}`, RATE_LIMIT_PRESETS.ORDER.limit, RATE_LIMIT_PRESETS.ORDER.windowMs)

    if (!rl.allowed) {
      logger.warn('RATE_LIMIT_EXCEEDED', { ip, metadata: { type: 'ORDER_PLACEMENT_LIMIT' } })
      return NextResponse.json(
        { success: false, message: 'Too many order requests. Please wait a moment.' },
        { status: 429 }
      )
    }

    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const result = await placeOrder(customer.sessionId, customer.restaurantId)

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    }

    if (result.orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: result.orderId },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            session: {
              select: {
                table: { select: { tableNumber: true } },
              },
            },
            _count: {
              select: { orderItems: true },
            },
          },
        })

        if (order) {
          const payload = {
            orderId: order.id,
            orderNumber: order.id.split('-')[0].toUpperCase(),
            tableNumber: order.session.table.tableNumber,
            totalAmount: Number(order.totalAmount),
            itemsCount: order._count.orderItems,
            createdAt: order.createdAt.toISOString(),
          }

          // Emit to owner restaurant room
          socketEmitter.emitToRestaurant(customer.restaurantId, ORDER_EVENTS.NEW, payload)

          // Emit to customer session room
          socketEmitter.emitToSession(customer.sessionId, ORDER_EVENTS.NEW, payload)

          // Emit cart cleared to customer session room
          socketEmitter.emitToSession(customer.sessionId, CART_EVENTS.UPDATED, {
            sessionId: customer.sessionId,
            totalItems: 0,
            subtotal: 0,
          })

          logger.audit('ORDER_PLACED', {
            orderId: order.id,
            restaurantId: customer.restaurantId,
            sessionId: customer.sessionId,
            ip,
            message: `Order #${payload.orderNumber} placed for Table ${payload.tableNumber}.`,
          })
        }
      } catch (err) {
        console.error('[POST Orders API] Socket emit error:', err)
      }
    }

    return NextResponse.json({ success: true, orderId: result.orderId })
  } catch (error) {
    console.error('[POST Orders API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const customer = await validateActiveCustomer({ allowCompletedOrClosed: true })
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const orders = await getSessionOrders(customer.sessionId)
    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('[GET Orders API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
