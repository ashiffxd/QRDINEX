import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getDashboardStats } from '@/services/owner/dashboard.service'

export async function GET(_request: NextRequest) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getDashboardStats(session.data.restaurantId)
    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('[Owner Stats API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
