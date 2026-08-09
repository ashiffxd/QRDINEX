import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getOrderDetails } from '@/services/owner/order.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Await params required in Next.js 15
    const resolvedParams = await params
    const { orderId } = resolvedParams

    const order = await getOrderDetails(session.data.restaurantId, orderId)

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('[Owner Order Details API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
