import prisma from '@/lib/prisma'
import { MenuItemStatus } from '@prisma/client'

export interface CartPayload {
  items: CartItemDetail[]
  totalItems: number
  subtotal: number
}

export interface CartItemDetail {
  id: string
  menuItemId: string
  itemName: string
  price: number
  quantity: number
  isVeg: boolean
  imageUrl: string | null
}

/**
 * Fetches the current cart for a session, along with item details and totals.
 */
export async function getCart(sessionId: string): Promise<CartPayload> {
  const cartItems = await prisma.cartItem.findMany({
    where: { sessionId },
    include: {
      menuItem: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  let totalItems = 0
  let subtotal = 0

  const items: CartItemDetail[] = cartItems.map((item) => {
    const price = Number(item.menuItem.price)
    totalItems += item.quantity
    subtotal += price * item.quantity

    return {
      id: item.id,
      menuItemId: item.menuItemId,
      itemName: item.menuItem.itemName,
      price,
      quantity: item.quantity,
      isVeg: item.menuItem.isVeg,
      imageUrl: item.menuItem.imageUrl,
    }
  })

  return { items, totalItems, subtotal }
}

/**
 * Adds, increments, decrements, or removes an item from the session's cart.
 */
export async function updateCartItem(
  sessionId: string,
  restaurantId: string,
  menuItemId: string,
  quantityChange: number
): Promise<{ success: boolean; error?: string }> {
  if (quantityChange === 0) return { success: true }

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
  })

  if (!menuItem || menuItem.restaurantId !== restaurantId) {
    return { success: false, error: 'INVALID_ITEM' }
  }

  if (menuItem.status === MenuItemStatus.INACTIVE) {
    return { success: false, error: 'ITEM_UNAVAILABLE' }
  }

  if (menuItem.status === MenuItemStatus.OUT_OF_STOCK) {
    return { success: false, error: 'ITEM_OUT_OF_STOCK' }
  }

  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      sessionId_menuItemId: {
        sessionId,
        menuItemId,
      },
    },
  })

  const currentQuantity = existingCartItem ? existingCartItem.quantity : 0
  const newQuantity = currentQuantity + quantityChange

  if (newQuantity <= 0) {
    if (existingCartItem) {
      await prisma.cartItem.delete({
        where: { id: existingCartItem.id },
      })
    }
  } else {
    await prisma.cartItem.upsert({
      where: {
        sessionId_menuItemId: {
          sessionId,
          menuItemId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        sessionId,
        menuItemId,
        quantity: newQuantity,
      },
    })
  }

  return { success: true }
}

/**
 * Empties the cart completely.
 */
export async function clearCart(sessionId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { sessionId },
  })
}
