import { NextRequest, NextResponse } from 'next/server'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import { getCart, clearCart } from '@/services/customer/cart.service'
import { socketEmitter, CART_EVENTS } from '@/lib/socket'

export async function GET() {
  try {
    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const cart = await getCart(customer.sessionId)
    return NextResponse.json({ success: true, cart })
  } catch (error) {
    console.error('[GET Cart API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await clearCart(customer.sessionId)

    try {
      socketEmitter.emitToSession(customer.sessionId, CART_EVENTS.UPDATED, {
        sessionId: customer.sessionId,
        totalItems: 0,
        subtotal: 0,
      })
    } catch (err) {
      console.error('[DELETE Cart API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE Cart API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
