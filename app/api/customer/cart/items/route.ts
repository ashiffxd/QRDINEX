import { NextRequest, NextResponse } from 'next/server'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import { updateCartItem, getCart } from '@/services/customer/cart.service'
import { socketEmitter, CART_EVENTS } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { menuItemId, quantityChange } = body

    if (!menuItemId || typeof quantityChange !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 })
    }

    const result = await updateCartItem(
      customer.sessionId,
      customer.restaurantId,
      menuItemId,
      quantityChange
    )

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    }

    try {
      const updatedCart = await getCart(customer.sessionId)
      socketEmitter.emitToSession(customer.sessionId, CART_EVENTS.UPDATED, {
        sessionId: customer.sessionId,
        totalItems: updatedCart.totalItems,
        subtotal: updatedCart.subtotal,
      })
    } catch (err) {
      console.error('[POST Cart Items API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST Cart Items API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
