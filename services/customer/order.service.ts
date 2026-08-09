import prisma from '@/lib/prisma'
import { MenuItemStatus, OrderStatus, Prisma } from '@prisma/client'

export async function placeOrder(sessionId: string, restaurantId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current cart items
      const cartItems = await tx.cartItem.findMany({
        where: { sessionId },
        include: { menuItem: true },
      })

      if (cartItems.length === 0) {
        throw new Error('CART_EMPTY')
      }

      // 2. Validate items and calculate totals
      let totalAmount = new Prisma.Decimal(0)
      const orderItemsData = []

      for (const item of cartItems) {
        // Re-validate status and stock
        if (item.menuItem.status === MenuItemStatus.INACTIVE) {
          throw new Error(`Item ${item.menuItem.itemName} is currently unavailable.`)
        }
        if (item.menuItem.status === MenuItemStatus.OUT_OF_STOCK) {
          throw new Error(`Item ${item.menuItem.itemName} is out of stock.`)
        }

        const price = item.menuItem.price
        const subtotal = price.mul(item.quantity)
        totalAmount = totalAmount.add(subtotal)

        orderItemsData.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtPurchase: price,
          subtotal: subtotal,
        })
      }

      // 3. Create the Order and OrderItems
      const order = await tx.order.create({
        data: {
          restaurantId,
          sessionId,
          status: OrderStatus.PLACED,
          totalAmount,
          orderItems: {
            create: orderItemsData,
          },
        },
      })

      // 4. Clear the cart
      await tx.cartItem.deleteMany({
        where: { sessionId },
      })

      return { success: true, orderId: order.id }
    })
  } catch (error: any) {
    console.error('[placeOrder] Transaction failed:', error)
    if (error.message === 'CART_EMPTY' || error.message.includes('unavailable') || error.message.includes('out of stock')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to place order. Please try again.' }
  }
}

export async function getSessionOrders(sessionId: string) {
  const orders = await prisma.order.findMany({
    where: { sessionId },
    include: {
      orderItems: {
        include: {
          menuItem: {
            select: {
              itemName: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return orders
}
