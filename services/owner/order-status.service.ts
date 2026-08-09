import prisma from '@/lib/prisma'
import { OrderAction, OrderStatus } from '@prisma/client'
import { validateTransition } from '@/lib/orders/state-machine'

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  action: OrderAction,
  changedBy: string,
  remarks?: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch and validate the order belongs to this restaurant
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, restaurantId: true },
    })

    if (!order || order.restaurantId !== restaurantId) {
      throw new Error('ORDER_NOT_FOUND')
    }

    // 2. Validate the state transition
    const validation = validateTransition(order.status, action, remarks)
    if (!validation.isValid || !validation.nextStatus) {
      throw new Error(validation.error || 'INVALID_TRANSITION')
    }

    // 3. Update the Order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: validation.nextStatus },
    })

    // 4. Create the Audit Log
    await tx.orderStatusLog.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: validation.nextStatus,
        action,
        changedBy,
        remarks: remarks || null,
      },
    })

    return updatedOrder
  })
}
