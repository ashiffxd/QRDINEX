import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import {
  getBillingSettings,
  updateBillingSettings,
} from '@/services/owner/restaurant.service'

export async function GET() {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getBillingSettings(auth.data.restaurantId)
    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('[GET /api/owner/settings/billing] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceChargeEnabled, serviceChargePercent, currency } = body

    if (serviceChargePercent !== undefined) {
      const num = Number(serviceChargePercent)
      if (isNaN(num) || num < 0 || num > 100) {
        return NextResponse.json(
          { success: false, message: 'Service charge percentage must be between 0% and 100%.' },
          { status: 400 }
        )
      }
    }

    const updated = await updateBillingSettings(auth.data.restaurantId, {
      serviceChargeEnabled: typeof serviceChargeEnabled === 'boolean' ? serviceChargeEnabled : undefined,
      serviceChargePercent: serviceChargePercent !== undefined ? Number(serviceChargePercent) : undefined,
      currency: typeof currency === 'string' ? currency : undefined,
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch (error: any) {
    console.error('[PATCH /api/owner/settings/billing] Error:', error)
    if (error.message === 'INVALID_SERVICE_CHARGE_PERCENT') {
      return NextResponse.json(
        { success: false, message: 'Service charge percentage must be between 0% and 100%.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
