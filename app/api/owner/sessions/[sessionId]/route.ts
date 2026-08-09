import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getSessionDetails } from '@/services/owner/session.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await requireRole(['OWNER'])
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Await params required in Next.js 15
    const resolvedParams = await params
    const { sessionId } = resolvedParams

    const details = await getSessionDetails(session.data.restaurantId, sessionId)

    if (!details) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, session: details })
  } catch (error) {
    console.error('[Owner Session Details API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
