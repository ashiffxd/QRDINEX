import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getMenuAnalytics } from '@/services/owner/analytics.service'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('OWNER')
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = (searchParams.get('range') as any) || '7days'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const menu = await getMenuAnalytics(auth.data.restaurantId, { range, startDate, endDate })
    return NextResponse.json({ success: true, menu })
  } catch (error: any) {
    console.error('[GET /api/owner/analytics/menu] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
