import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getKitchenOrders } from '@/services/owner/order.service'

export async function GET() {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const orders = await getKitchenOrders(auth.data.restaurantId)
    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error('[GET /api/owner/kitchen/orders] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
